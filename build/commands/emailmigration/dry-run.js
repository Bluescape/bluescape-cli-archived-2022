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
exports.command = 'dry-run';
exports.desc = 'Dry run migration of member emails';
const builder = (yargs) => yargs.example([['$0 emailmigration dry-run --mapping-csv=xx.csv']]);
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
    if (!(0, fs_1.existsSync)(path_1.default.join(__dirname, '../../../dry-run-report'))) {
        (0, fs_1.mkdirSync)(path_1.default.join(__dirname, '../../../dry-run-report'));
    }
    const provideEmailMigrationDryRunReport = (0, fs_1.createWriteStream)(path_1.default.resolve(__dirname, `../../../dry-run-report/${path_1.default.parse(argv.mappingCsv.toString()).name}_${Date.now()}.csv`));
    provideEmailMigrationDryRunReport.write('Existing Email,SSO Email,Workspace Reassigning Email,Status');
    for await (const [index, mappedEmail] of mappedEmails.entries()) {
        const { existing, sso, workspaceOwner } = mappedEmail;
        const existingEmail = existing.toLowerCase();
        const ssoEmail = sso.toLowerCase();
        const workspaceOwnerEmail = workspaceOwner.toLowerCase();
        let sourceMember;
        let targetMember;
        let sourceMemberBelongsToManyOrgs = false;
        let targetMemberBelongsToManyOrgs = false;
        const progressing = `${index + 1}/${totalUsersCount} :  ${existingEmail}`;
        spinner.start(`${progressing} is processing..`);
        const validExistingEmail = (0, email_migrate_service_1.validateEmail)(existingEmail);
        if (validExistingEmail?.error) {
            provideEmailMigrationDryRunReport.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${validExistingEmail?.error} - ${existingEmail}`);
            handleErrors(validExistingEmail.error, progressing, spinner);
            continue;
        }
        const getOrgMember = await services_1.emailMigrationService.getOrganizationMemberByEmail(organizationId, existingEmail);
        if (getOrgMember && getOrgMember?.error) {
            provideEmailMigrationDryRunReport.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},Error in getting Organization ${organizationId} Member - ${getOrgMember?.error}`);
            handleErrors(`Error in getting Organization ${organizationId} Member - ${getOrgMember?.error}`, progressing, spinner);
            continue;
        }
        if ((0, validators_1.valueExists)(getOrgMember) && getOrgMember.id) {
            sourceMember = getOrgMember;
        }
        if (!sourceMember) {
            const message = `${existingEmail} is not a member of the organization ${organizationId}`;
            provideEmailMigrationDryRunReport.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},Failed with ${message}`);
            handleErrors(`Failed with ${message}`, progressing, spinner);
            continue;
        }
        const getSourceMemberOrgs = await services_1.emailMigrationService.checkIfUserBelongsToManyOrganizations(sourceMember.id);
        if (getSourceMemberOrgs && getSourceMemberOrgs?.error) {
            provideEmailMigrationDryRunReport.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},Failed to fetch existing user organizations ${getSourceMemberOrgs?.error}`);
            handleErrors(`Failed to fetch existing user organizations ${getSourceMemberOrgs?.error}`, progressing, spinner);
            continue;
        }
        if (getSourceMemberOrgs) {
            sourceMemberBelongsToManyOrgs = true;
        }
        if (ssoEmail) {
            const validSsoEmail = (0, email_migrate_service_1.validateEmail)(ssoEmail);
            if (validSsoEmail?.error) {
                provideEmailMigrationDryRunReport.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},SSO Email - ${validSsoEmail?.error} - ${ssoEmail}`);
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
                    provideEmailMigrationDryRunReport.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},Failed to fetch SSO user organizations ${getTargetMemberOrgs?.error}`);
                    handleErrors(`Failed to fetch SSO user organizations ${getTargetMemberOrgs.error}`, progressing, spinner);
                    continue;
                }
                if (getTargetMemberOrgs) {
                    targetMemberBelongsToManyOrgs = true;
                }
                if (!targetMemberBelongsToManyOrgs) {
                    provideEmailMigrationDryRunReport.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${ssoEmail} is already used. So no email migration done`);
                    spinner.info(chalk_1.default.gray(`${progressing} - ${ssoEmail} is already used. So no email migration done.\n`));
                    continue;
                }
                provideEmailMigrationDryRunReport.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${ssoEmail} is already used. So no email migration done`);
                spinner.info(chalk_1.default.gray(`${progressing} - ${ssoEmail} is already used. So no email migration done.\n`));
            }
            else {
                if (!sourceMemberBelongsToManyOrgs) {
                    const reportMessage = [];
                    if (sourceMember.role.type === role_types_1.Roles.Visitor) {
                        reportMessage.push(`Role updated to ${organization?.defaultOrganizationUserRole?.type}`);
                        spinner.info(chalk_1.default.gray(`${progressing} - ${existingEmail} role will be updated to ${organization?.defaultOrganizationUserRole?.type}\n`));
                    }
                    reportMessage.push(`Existing email ${existingEmail} will be migrated to ${ssoEmail}`);
                    provideEmailMigrationDryRunReport.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${reportMessage.join(' & ')}`);
                    continue;
                }
                provideEmailMigrationDryRunReport.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${existingEmail} belongs to many organization. So no email update done`);
                spinner.info(chalk_1.default.gray(`${progressing} - ${existingEmail} belongs to many organization. So no email update done.\n`));
            }
        }
        else {
            if (existingEmail === organizationOwnerEmail) {
                provideEmailMigrationDryRunReport.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},Organization Owner ${existingEmail} cannot to be converted to visitor`);
                handleErrors(`Organization Owner ${existingEmail} cannot to be converted to visitor`, progressing, spinner);
                continue;
            }
            if (!organization?.canHaveGuests) {
                provideEmailMigrationDryRunReport.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},Organization ${organizationId} doesn't allow to have guests. Please enable the feature to convert to visitor`);
                handleErrors(`Organization ${organizationId} doesn't allow to have guests. Please enable the feature to convert to visitor`, progressing, spinner);
                continue;
            }
            if (sourceMember.role.type === role_types_1.Roles.Visitor) {
                provideEmailMigrationDryRunReport.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${existingEmail} is already a ${role_types_1.Roles.Visitor} in the organization`);
                handleErrors(`${existingEmail} is already a ${role_types_1.Roles.Visitor} in the organization`, progressing, spinner);
                continue;
            }
            let newOwner;
            if (workspaceOwnerEmail) {
                const validExistingEmail = (0, email_migrate_service_1.validateEmail)(workspaceOwnerEmail);
                if (validExistingEmail?.error) {
                    provideEmailMigrationDryRunReport.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${validExistingEmail.error} - ${workspaceOwnerEmail}`);
                    handleErrors(validExistingEmail.error, progressing, spinner);
                    continue;
                }
                if (existingEmail === workspaceOwnerEmail) {
                    provideEmailMigrationDryRunReport.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},Owner Reassignment Email - ${workspaceOwnerEmail} cannot be the same as Existing Email - ${existingEmail}`);
                    handleErrors(`Owner Reassignment Email - ${workspaceOwnerEmail} cannot be the same as Existing Email - ${existingEmail}`, progressing, spinner);
                    continue;
                }
                const getOrgMember = await services_1.emailMigrationService.getOrganizationMemberByEmail(organizationId, workspaceOwnerEmail);
                if (getOrgMember && getOrgMember?.error) {
                    provideEmailMigrationDryRunReport.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},Error in getting Organization ${organizationId} Member - ${getOrgMember?.error}`);
                    handleErrors(`Error in getting Organization ${organizationId} Member - ${getOrgMember?.error}`, progressing, spinner);
                    continue;
                }
                if ((0, validators_1.valueExists)(getOrgMember) && getOrgMember.id) {
                    newOwner = getOrgMember;
                }
                else {
                    provideEmailMigrationDryRunReport.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},Workspace Reassignment Email - ${workspaceOwnerEmail} is not a member of the organization`);
                    handleErrors(`Workspace Reassignment Email - ${workspaceOwnerEmail} is not a member of the organization`, progressing, spinner);
                    continue;
                }
            }
            const visitorRole = await services_1.emailMigrationService.getOrganizationVisitorRoleId(organizationId);
            if (visitorRole?.error) {
                provideEmailMigrationDryRunReport.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${visitorRole.error}`);
                handleErrors(visitorRole.error, progressing, spinner);
                continue;
            }
            if (visitorRole) {
                const reassignedOwner = workspaceOwnerEmail
                    ? workspaceOwnerEmail
                    : 'Organization Owner';
                spinner.info(chalk_1.default.green(`${progressing} - Updated ${existingEmail} role to visitor and reassigned his worksapces to ${reassignedOwner}\n`));
                provideEmailMigrationDryRunReport.write(`\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${existingEmail} role will be updated to Visitor and his workspaces will be reassigned to ${reassignedOwner} if any`);
            }
        }
    }
};
exports.handler = handler;
//# sourceMappingURL=dry-run.js.map