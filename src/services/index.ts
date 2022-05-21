import { AuthService } from "./auth.service";
import { UserService } from "./user.service";

const authService = new AuthService();
const userService = new UserService();

export { authService, userService };
