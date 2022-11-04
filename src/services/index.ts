import { AuthService } from './auth.service';
import { CustomLinkService } from './custom-link.service';
import { EmailMigrationService } from './email-migrate.service';
import { OrganizationService } from './organization.service';
import { UserService } from './user.service';

const authService = new AuthService();
const userService = new UserService();
const customLinkService = new CustomLinkService();
const organizationService = new OrganizationService();
const emailMigrationService = new EmailMigrationService();

export { authService, userService, customLinkService, organizationService, emailMigrationService };
