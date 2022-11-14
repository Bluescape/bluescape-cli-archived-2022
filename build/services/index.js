"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailMigrationService = exports.organizationService = exports.customLinkService = exports.userService = exports.authService = void 0;
const auth_service_1 = require("./auth.service");
const custom_link_service_1 = require("./custom-link.service");
const email_migrate_service_1 = require("./email-migrate.service");
const organization_service_1 = require("./organization.service");
const user_service_1 = require("./user.service");
const authService = new auth_service_1.AuthService();
exports.authService = authService;
const userService = new user_service_1.UserService();
exports.userService = userService;
const customLinkService = new custom_link_service_1.CustomLinkService();
exports.customLinkService = customLinkService;
const organizationService = new organization_service_1.OrganizationService();
exports.organizationService = organizationService;
const emailMigrationService = new email_migrate_service_1.EmailMigrationService();
exports.emailMigrationService = emailMigrationService;
//# sourceMappingURL=index.js.map