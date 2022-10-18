import { AuthService } from './auth.service';
import { CustomLinkService } from './custom-link.service';
import { EmailMigrationService } from './email-migrate.service';
import { OrganizationService } from './organization.service';
import { UserService } from './user.service';

const authService = new AuthService();
const userService = new UserService();
const emailMigrationService = new EmailMigrationService();
const customLinkService = new CustomLinkService();
const organizationService = new OrganizationService();

export { authService, userService, customLinkService, organizationService, emailMigrationService };
