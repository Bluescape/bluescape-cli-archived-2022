import { AuthService } from './auth.service';
import { CustomLinkService } from './custom-link.service';
import { UserService } from './user.service';

const authService = new AuthService();
const userService = new UserService();
const customLinkService = new CustomLinkService();

export { authService, userService, customLinkService };
