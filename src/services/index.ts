import { AuthService } from './auth.service';
import { CustomLinkService } from './custom-link.service';
import { EmailMigrationService } from './email-migrate.service';
import { OrganizationService } from './organization.service';
import { ProvisionLicenseService } from './provision-license.service';
import { UserService } from './user.service';
import { AccountService } from './account.service';

const authService = new AuthService();
const userService = new UserService();
const customLinkService = new CustomLinkService();
const organizationService = new OrganizationService();
const emailMigrationService = new EmailMigrationService();
const provisionLicenseService = new ProvisionLicenseService();
const accountService = new AccountService();

export {
  authService,
  userService,
  customLinkService,
  organizationService,
  emailMigrationService,
  provisionLicenseService,
  accountService,
};
