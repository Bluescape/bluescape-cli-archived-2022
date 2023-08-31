"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.builder = exports.desc = exports.command = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = require("fs");
const ora_1 = __importDefault(require("ora"));
const path_1 = __importDefault(require("path"));
const conf_1 = require("../../conf");
const services_1 = require("../../services");
const email_migrate_service_1 = require("../../services/email-migrate.service");
const csv_1 = require("../../utils/csv");
const validators_1 = require("../../utils/validators");
const role_types_1 = require("../user/role.types");
const ask_migration_information_1 = require("./ask-migration-information");
exports.command = 'execute';
exports.desc = 'Execute migration of member emails';
const builder = (yargs) => yargs.example([['$0 emailmigration execute --mapping-csv=xx.csv']]);
exports.builder = builder;
const handleErrors = (error, progressing, spinner) => {
    if (error) {
        spinner.fail(chalk_1.default.red(`${progressing} - ${error} \n`));
    }
};
const handler = async (argv) => {
    const spinner = (0, ora_1.default)({
        isSilent: argv.quiet,
    });
    const { mappingCsv } = argv;
    if (!mappingCsv) {
        throw new Error('CSV file path not proivided --mapping-csv=yy.csv');
    }
    const { user: { email }, } = (0, conf_1.getActiveProfile)();
    if (!email) {
        spinner.fail(chalk_1.default.red(`No Active user found. Login to proceed.\n`));
        return;
    }
    const sessionUser = await services_1.emailMigrationService.validateSessionUserRole(email, role_types_1.Roles.Admin);
    if (sessionUser && sessionUser.error) {
        spinner.fail(chalk_1.default.red(`Session ${sessionUser.error}`));
        return;
    }
    if (!sessionUser) {
        spinner.fail(chalk_1.default.red(`Error: Forbidden. User not permitted to perform this action`));
        return;
    }
    const organizationId = await (0, ask_migration_information_1.askOrganizationId)();
    const { data, error: errInFetchingOrg } = await services_1.organizationService.getOrganizationById(organizationId);
    if (errInFetchingOrg) {
        spinner.fail(chalk_1.default.red(`Error in getting Organization ${organizationId} details ${errInFetchingOrg}`));
        return;
    }
    const organization = data?.organization || {};
    if (!organization) {
        spinner.fail(chalk_1.default.red(`Organization ${organizationId} not found`));
        return;
    }
    const mappingData = await (0, csv_1.getJsonFromCSV)(mappingCsv);
    const mappedEmails = (0, email_migrate_service_1.csvFileDataValidation)(mappingData);
    const existingEmails = mappedEmails.map((data) => data.existing);
    spinner.start(`Validating Owner email existence in the Mapping CSV`);
    const organizationOwnerEmail = await services_1.emailMigrationService.getOrganizationOwner(organizationId);
    if (organizationOwnerEmail && organizationOwnerEmail.error) {
        spinner.fail(chalk_1.default.red(`Error: ${organizationOwnerEmail.error}`));
        return;
    }
    if (!organizationOwnerEmail) {
        spinner.fail(chalk_1.default.red(`Failed to fetch organization owner information`));
        return;
    }
    spinner.start(`Started to perform migration for ${organizationId}`);
    const startTime = performance.now();
    const totalUsersCount = mappingData.length;
    let failedEmailMigrationWithReasons = 0;
    if (!(0, fs_1.existsSync)(path_1.default.join(__dirname, '../../../logs'))) {
        (0, fs_1.mkdirSync)(path_1.default.join(__dirname, '../../../logs'));
    }
    const writeFailedEmailMigrationsToCsv = (0, fs_1.createWriteStream)(path_1.default.resolve(__dirname, `../../../logs/${path_1.default.parse(argv.mappingCsv.toString()).name}_${Date.now()}.csv`));
    writeFailedEmailMigrationsToCsv.write('Existing Email,SSO Email,Workspace Owner Email,Message');
    for await (const [index, mappedEmail] of mappedEmails.entries()) {
        const { existing: existingEmail, sso: ssoEmail, workspaceOwner: workspaceOwnerEmail, } = mappedEmail;
        let sourceMember;
        let targetMember;
        let sourceMemberBelongsToManyOrgs = false;
        const progressing = `${index + 1}/${totalUsersCount} :  ${existingEmail}`;
        spinner.start(`${progressing} is processing..`);
        const validExistingEmail = (0, email_migrate_service_1.validateEmail)(existingEmail);
        if (validExistingEmail?.error) {
            failedEmailMigrationWithReasons++;
            writeFailedEmailMigrationsToCsv.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${validExistingEmail?.error} - ${existingEmail}`);
            handleErrors(validExistingEmail.error, progressing, spinner);
            continue;
        }
        const getOrgMember = await services_1.emailMigrationService.getOrganizationMemberByEmail(organizationId, existingEmail);
        if (getOrgMember && getOrgMember?.error) {
            failedEmailMigrationWithReasons++;
            writeFailedEmailMigrationsToCsv.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},Error in getting Organization ${organizationId} Member - ${getOrgMember?.error}`);
            handleErrors(`Error in getting Organization ${organizationId} Member - ${getOrgMember?.error}`, progressing, spinner);
            continue;
        }
        if ((0, validators_1.valueExists)(getOrgMember) && getOrgMember.id) {
            sourceMember = getOrgMember;
        }
        if (!sourceMember) {
            const message = `${existingEmail} is not a member of the organization ${organizationId}`;
            failedEmailMigrationWithReasons++;
            writeFailedEmailMigrationsToCsv.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},Failed with ${message}`);
            handleErrors(`Failed with ${message}`, progressing, spinner);
            continue;
        }
        const getSourceMemberOrgs = await services_1.emailMigrationService.checkIfUserBelongsToManyOrganizations(sourceMember.id);
        if (getSourceMemberOrgs && getSourceMemberOrgs?.error) {
            failedEmailMigrationWithReasons++;
            writeFailedEmailMigrationsToCsv.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${getSourceMemberOrgs?.error}`);
            handleErrors(getSourceMemberOrgs?.error, progressing, spinner);
            continue;
        }
        if (getSourceMemberOrgs) {
            sourceMemberBelongsToManyOrgs = true;
        }
        if (ssoEmail) {
            const validSsoEmail = (0, email_migrate_service_1.validateEmail)(ssoEmail);
            if (validSsoEmail?.error) {
                failedEmailMigrationWithReasons++;
                writeFailedEmailMigrationsToCsv.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${validSsoEmail?.error} - ${validExistingEmail?.error} - ${ssoEmail}`);
                handleErrors(`SSO Email - ${validSsoEmail?.error}`, progressing, spinner);
                continue;
            }
            const { data, errors: ssoUserExistenceError } = await services_1.userService.getUserFromEmail(ssoEmail, ['id']);
            if (ssoUserExistenceError) {
                const [{ message }] = ssoUserExistenceError;
                spinner.info(chalk_1.default.gray(`${progressing} - SSO ${message}.\n`));
            }
            targetMember = data?.user || {};
            if ((0, validators_1.valueExists)(targetMember) && targetMember?.id) {
                const getTargetMemberOrgs = await services_1.emailMigrationService.checkIfUserBelongsToManyOrganizations(targetMember.id);
                if (getTargetMemberOrgs && getTargetMemberOrgs?.error) {
                    failedEmailMigrationWithReasons++;
                    writeFailedEmailMigrationsToCsv.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},Failed to fetch SSO user organizations ${getTargetMemberOrgs?.error}`);
                    handleErrors(`Failed to fetch SSO user organizations ${getTargetMemberOrgs.error}`, progressing, spinner);
                    continue;
                }
                const targetedMember = await services_1.emailMigrationService.splitOrMergeAccount(organizationId, ssoEmail, targetMember.id);
                if (targetedMember && targetedMember?.error) {
                    failedEmailMigrationWithReasons++;
                    writeFailedEmailMigrationsToCsv.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${targetedMember?.error}`);
                    handleErrors(`Error in merging Organization ${organizationId} Member - ${targetedMember?.error}`, progressing, spinner);
                    continue;
                }
                spinner.info(chalk_1.default.green(`${progressing} - SSO Email already exists. \n`));
                const requestToTransferResources = await services_1.emailMigrationService.requestToTransferMemberResourcesInOrganization(organizationId, sourceMember.id, targetedMember);
                if (requestToTransferResources?.error) {
                    if (requestToTransferResources.error &&
                        requestToTransferResources.error?.statusCode === 404) {
                        spinner.info(chalk_1.default.green(`${progressing} - ${existingEmail} does not have any resources in ${organization.id}.\n`));
                        if (!sourceMemberBelongsToManyOrgs) {
                            const { data: delRes, errors: delErr } = await services_1.userService.deleteUserViaGL(sourceMember.id, null, true);
                            if (delErr) {
                                const [{ message }] = delErr;
                                handleErrors(`Error when deleting user ${existingEmail} - ${message}`, progressing, spinner);
                            }
                            else {
                                spinner.succeed(`User ${email} deleted`);
                            }
                        }
                        continue;
                    }
                    writeFailedEmailMigrationsToCsv.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail}, Failed to send request to transfer resources ${requestToTransferResources?.error?.message} `);
                    handleErrors(`Failed to send request to transfer resources ${requestToTransferResources?.error?.message}`, progressing, spinner);
                    continue;
                }
                else {
                    spinner.info(chalk_1.default.green(`${progressing} - SSO Email already exists. Request to transfer resources from ${existingEmail} to ${ssoEmail} is sent \n`));
                }
            }
            else {
                if (!sourceMemberBelongsToManyOrgs) {
                    if (sourceMember.role.type === role_types_1.Roles.Visitor) {
                        const updateMemberRole = await services_1.organizationService.updateOrganizationMemberRole(sourceMember.id, organizationId, organization?.defaultOrganizationUserRole?.id);
                        if (updateMemberRole?.error) {
                            failedEmailMigrationWithReasons++;
                            writeFailedEmailMigrationsToCsv.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${updateMemberRole.error}`);
                            handleErrors(updateMemberRole.error, progressing, spinner);
                            continue;
                        }
                        spinner.info(chalk_1.default.green(`${progressing} - Updated ${existingEmail} role to ${organization?.defaultOrganizationUserRole?.type}\n`));
                    }
                    const updateUserEmail = await services_1.userService.updateUserEmail(sourceMember.id, ssoEmail, ['id', 'email']);
                    if (updateUserEmail.error) {
                        failedEmailMigrationWithReasons++;
                        writeFailedEmailMigrationsToCsv.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},Failed to update user email ${updateUserEmail.error}`);
                        handleErrors(`Failed to update user email ${updateUserEmail.error}`, progressing, spinner);
                    }
                    else {
                        spinner.info(chalk_1.default.green(`${progressing} - Successfully updated ${existingEmail} to ${ssoEmail}\n`));
                    }
                    continue;
                }
                const targettedMember = await services_1.emailMigrationService.splitOrMergeAccount(organizationId, ssoEmail);
                if (targettedMember && targettedMember?.error) {
                    failedEmailMigrationWithReasons++;
                    writeFailedEmailMigrationsToCsv.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${targettedMember?.error}`);
                    handleErrors(`Error in merging Organization ${organizationId} Member - ${targettedMember?.error}`, progressing, spinner);
                    continue;
                }
                spinner.info(chalk_1.default.green(`${progressing} - SSO Email does not exists. So, created a new user with ${ssoEmail} and added as a member to ${organizationId} organization. \n`));
                const requestToTransferResources = await services_1.emailMigrationService.requestToTransferMemberResourcesInOrganization(organizationId, sourceMember.id, targettedMember);
                if (requestToTransferResources?.error) {
                    if (requestToTransferResources.error &&
                        requestToTransferResources.error?.statusCode === 404) {
                        spinner.info(chalk_1.default.green(`${progressing} - ${existingEmail} does not have any resources in ${organization.id}.\n`));
                        continue;
                    }
                    writeFailedEmailMigrationsToCsv.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail}, Failed to send request to transfer resources ${requestToTransferResources?.error?.message}`);
                    handleErrors(`Failed to send request to transfer resources ${requestToTransferResources?.error?.message}`, progressing, spinner);
                    continue;
                }
                else {
                    spinner.info(chalk_1.default.green(`${progressing} - SSO Email already exists. Request to transfer resources from ${existingEmail} to ${ssoEmail} is sent \n`));
                }
            }
        }
        else {
            if (existingEmail === organizationOwnerEmail) {
                failedEmailMigrationWithReasons++;
                writeFailedEmailMigrationsToCsv.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${validExistingEmail?.error} - ${existingEmail}`);
                handleErrors(`Organization Owner ${existingEmail} cannot to be converted to visitor`, progressing, spinner);
                continue;
            }
            if (!organization?.canHaveGuests) {
                failedEmailMigrationWithReasons++;
                writeFailedEmailMigrationsToCsv.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},Organization ${organizationId} doesn't allow to have guests. Please enable the feature to convert to visitor`);
                handleErrors(`Organization ${organizationId} doesn't allow to have guests. Please enable the feature to convert to visitor`, progressing, spinner);
                continue;
            }
            if (sourceMember.role.type === role_types_1.Roles.Visitor) {
                failedEmailMigrationWithReasons++;
                writeFailedEmailMigrationsToCsv.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${existingEmail} is already a ${role_types_1.Roles.Visitor} in the organization`);
                handleErrors(`${existingEmail} is already a ${role_types_1.Roles.Visitor} in the organization`, progressing, spinner);
                continue;
            }
            let newOwner;
            if (workspaceOwnerEmail) {
                const validExistingEmail = (0, email_migrate_service_1.validateEmail)(workspaceOwnerEmail);
                if (validExistingEmail?.error) {
                    failedEmailMigrationWithReasons++;
                    writeFailedEmailMigrationsToCsv.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${validExistingEmail.error} - ${workspaceOwnerEmail}`);
                    handleErrors(validExistingEmail.error, progressing, spinner);
                    continue;
                }
                if (existingEmail === workspaceOwnerEmail) {
                    failedEmailMigrationWithReasons++;
                    writeFailedEmailMigrationsToCsv.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},Owner Reassignment Email - ${workspaceOwnerEmail} cannot be the same as Existing Email - ${existingEmail}`);
                    handleErrors(`Owner Reassignment Email - ${workspaceOwnerEmail} cannot be the same as Existing Email - ${existingEmail}`, progressing, spinner);
                    continue;
                }
                const getOrgMember = await services_1.emailMigrationService.getOrganizationMemberByEmail(organizationId, workspaceOwnerEmail);
                if (getOrgMember && getOrgMember?.error) {
                    failedEmailMigrationWithReasons++;
                    writeFailedEmailMigrationsToCsv.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},Error in getting Organization ${organizationId} Member - ${getOrgMember?.error}`);
                    handleErrors(`Error in getting Organization ${organizationId} Member - ${getOrgMember?.error}`, progressing, spinner);
                    continue;
                }
                if ((0, validators_1.valueExists)(getOrgMember) && getOrgMember.id) {
                    newOwner = getOrgMember;
                }
                else {
                    failedEmailMigrationWithReasons++;
                    writeFailedEmailMigrationsToCsv.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},Workspace Reassignment Email - ${workspaceOwnerEmail} is not a member of the organization`);
                    handleErrors(`Workspace Reassignment Email - ${workspaceOwnerEmail} is not a member of the organization`, progressing, spinner);
                    continue;
                }
            }
            const visitorRole = await services_1.emailMigrationService.getOrganizationRoleByType(organizationId, role_types_1.Roles.Visitor);
            if (visitorRole?.error) {
                failedEmailMigrationWithReasons++;
                writeFailedEmailMigrationsToCsv.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${validExistingEmail.error}`);
                handleErrors(visitorRole.error, progressing, spinner);
                continue;
            }
            if (visitorRole) {
                const updateMemberRole = newOwner && newOwner?.id
                    ? await services_1.organizationService.updateOrganizationMemberRole(sourceMember.id, organizationId, visitorRole, newOwner.id)
                    : await services_1.organizationService.updateOrganizationMemberRole(sourceMember.id, organizationId, visitorRole);
                if (updateMemberRole?.error) {
                    failedEmailMigrationWithReasons++;
                    writeFailedEmailMigrationsToCsv.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${updateMemberRole.error}`);
                    handleErrors(updateMemberRole.error, progressing, spinner);
                    continue;
                }
                const reassignedOwner = workspaceOwnerEmail
                    ? workspaceOwnerEmail
                    : 'Organization Owner';
                spinner.info(chalk_1.default.green(`${progressing} - Updated ${existingEmail} role to visitor and reassigned his worksapces to ${reassignedOwner}\n`));
            }
        }
    }
    const endTime = performance.now();
    console.log(`\n`);
    spinner.info(chalk_1.default.blue(`Total users: ${totalUsersCount}     Execution Time: ${(endTime - startTime).toFixed(2)} ms\n`));
    if (failedEmailMigrationWithReasons === 0) {
        spinner.succeed(chalk_1.default.green(`All users email has been migrated, Successful count - ${totalUsersCount}\n`));
    }
    else {
        spinner.succeed(chalk_1.default.green(`Passed: ${totalUsersCount - failedEmailMigrationWithReasons}\n`));
        spinner.fail(chalk_1.default.red(`Failed:  ${failedEmailMigrationWithReasons}\n`));
    }
};
exports.handler = handler;
//# sourceMappingURL=execute.js.map