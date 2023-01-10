"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.builder = exports.desc = exports.command = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const conf_1 = require("../../conf");
const services_1 = require("../../services");
const ask_migration_information_1 = require("../emailmigration/ask-migration-information");
const role_types_1 = require("../user/role.types");
const ask_provision_license_information_1 = require("./ask-provision-license-information");
exports.command = 'link-external-legacy-subscription';
exports.desc = 'set the license purchased for the legacy enterprise';
const builder = (yargs) => yargs.example([['$0 provisionlicense link-external-legacy-subscription']]);
exports.builder = builder;
const handler = async (argv) => {
    const spinner = (0, ora_1.default)({
        isSilent: argv.quiet,
    });
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
    const legacySubscriptionInput = await (0, ask_provision_license_information_1.askLegacySubscriptionDetails)();
    const result = await services_1.provisionLicenseService.linkExternalLegacySubscription(organizationId, legacySubscriptionInput, [
        'createdAt',
        'interval',
        'licenseQuantity',
        'licensesCurrentlyInUse',
        'organizationStorageLimitMb',
        'mode',
        'planName',
        'updatedAt',
    ]);
    if (result) {
        if (result?.errors) {
            spinner.fail(chalk_1.default.red(result?.errors[0]?.message));
            return;
        }
        if (result?.data?.linkExternalLegacySubscription) {
            spinner.succeed(chalk_1.default.green(`Successfully linked the external legacy subscription ${legacySubscriptionInput.externalSubscriptionId}  to the organization ${organizationId}!`));
            spinner.succeed(chalk_1.default.green(JSON.stringify(result.data.linkExternalLegacySubscription)));
            return;
        }
    }
    else {
        spinner.fail(chalk_1.default.red(`Failed to fetch external legacy subscription results`));
        return;
    }
};
exports.handler = handler;
//# sourceMappingURL=link-external-legacy-subscription.js.map