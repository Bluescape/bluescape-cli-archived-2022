"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.builder = exports.desc = exports.command = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const services_1 = require("../../services");
const validators_1 = require("../../utils/validators");
exports.command = 'set';
exports.desc = 'Siloed user provisioning';
const builder = (yargs) => yargs.example([
    [
        '$0 siloeduserprovision set --organizationId="organizationId" --accountId="accountId"',
    ],
]);
exports.builder = builder;
const handler = async (argv) => {
    const startTime = performance.now();
    const { organizationId, accountId } = argv;
    if (!organizationId) {
        throw new Error('Request cannot be empty. Please pass organizationId.');
    }
    if (organizationId && !(0, validators_1.isId)(organizationId)) {
        throw new Error('Invalid organizationId. Value must be a valid Id');
    }
    if (accountId && !(0, validators_1.isId)(accountId)) {
        throw new Error('Invalid accountId. Value must be a valid Id');
    }
    const spinner = (0, ora_1.default)({
        isSilent: argv.quiet,
    });
    const failedOrgIDPWithReasons = [];
    const failedOrgAccountWithReasons = [];
    let organizationsIDPSuccessCount = 0;
    let organizationsAccountSuccessCount = 0;
    try {
        let primaryOrganization;
        if (organizationId) {
            const organization = await services_1.organizationService.getOrganizationById(organizationId);
            if (organization.errors) {
                spinner.fail(chalk_1.default.red(`Failed to get organization:  ${organizationId}\nReason: ${organization.errors[0].message}`));
                return;
            }
            primaryOrganization = organization.data.organization;
            if (!primaryOrganization?.identityProvider) {
                spinner.fail(chalk_1.default.red(`Failed to get organization IDP:  ${organizationId}`));
                return;
            }
        }
        if (accountId) {
            const account = await services_1.accountService.getAccountById(accountId);
            if (account.error) {
                const message = account.error.response.data.message || account.error.message;
                spinner.fail(chalk_1.default.red(`Failed to get account:  ${accountId}\nReason: ${message}`));
                return;
            }
        }
        const mapOrganizations = async (nextCursor = null) => {
            const { data: { organizations: { results, next, totalItems }, }, } = await services_1.organizationService.getAllOrganizations(100, nextCursor);
            nextCursor = next;
            for await (const organization of results) {
                try {
                    if (organization?.identityProvider &&
                        organization?.identityProvider?.id ===
                            primaryOrganization?.identityProvider?.id) {
                        if (organizationId) {
                            await services_1.organizationService.updateOrganizationAutoAssociateIDPUser(organization.id, !organization.autoAssociateIdentityProviderUser &&
                                organization.id === organizationId);
                            organizationsIDPSuccessCount += 1;
                            spinner.succeed(chalk_1.default.green(`Updated IDP for organization: ${organization?.id}`));
                            organization.autoAssociateIdentityProviderUser = (!organization.autoAssociateIdentityProviderUser &&
                                organization.id === organizationId);
                        }
                        if (accountId) {
                            const data = await services_1.organizationService.addOrganizationToAccount(organization?.id, accountId);
                            if (data.error) {
                                const message = data.error.response.data.message || data.error;
                                spinner.fail(chalk_1.default.red(`Failed to update account for organization: ${organization?.id}. Reason: ${message}`));
                                failedOrgAccountWithReasons.push({
                                    organizationId: organization?.id,
                                    message,
                                });
                            }
                            else {
                                organizationsAccountSuccessCount += 1;
                                spinner.succeed(chalk_1.default.blue(`Updated account for organization: ${organization?.id}`));
                            }
                        }
                    }
                }
                catch (e) {
                    spinner.fail(chalk_1.default.red(`Failed to Update IDP for organization: ${organization?.id}`, e?.message));
                    failedOrgIDPWithReasons.push({
                        organizationId: organization?.id,
                        message: e?.message,
                    });
                    continue;
                }
            }
            if (nextCursor && nextCursor !== null) {
                await mapOrganizations(nextCursor);
            }
        };
        await mapOrganizations();
    }
    catch (e) {
        spinner.fail(chalk_1.default.red(e.message));
    }
    const endTime = performance.now();
    console.log(`\n`);
    spinner.info(chalk_1.default.blue(`Execution Time: ${(endTime - startTime).toFixed(2)} ms\n`));
    if (organizationId) {
        spinner.succeed(chalk_1.default.green(`Total no of organizations successfully updated the IDP user flag: ${organizationsIDPSuccessCount}\n`));
        spinner.fail(chalk_1.default.red(`Total no of organizations failed to update organization IDP user flag:  ${failedOrgIDPWithReasons.length}\n`));
    }
    if (accountId) {
        spinner.succeed(chalk_1.default.green(`Total no of organizations successfully mapped the accountId: ${organizationsAccountSuccessCount}\n`));
        spinner.fail(chalk_1.default.red(`Total no of organizations failed to map the accountId:  ${failedOrgAccountWithReasons.length}\n`));
    }
};
exports.handler = handler;
//# sourceMappingURL=set.js.map