"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.builder = exports.desc = exports.command = void 0;
const ora_1 = __importDefault(require("ora"));
const ask_credentials_1 = require("./ask-credentials");
const shared_1 = require("../../shared");
const conf_1 = require("../../conf");
const services_1 = require("../../services");
exports.command = 'login [email]';
exports.desc = 'Bluescape Login';
const builder = (yargs) => yargs
    .options({ ...shared_1.baseOptions })
    .positional('email', { type: 'string' })
    .example([['$0 login'], ['$0 login {email}']]);
exports.builder = builder;
const handler = async (_argv) => {
    const spinner = (0, ora_1.default)({
        isSilent: _argv.quiet,
    });
    const { email } = _argv;
    const { username, password } = await (0, ask_credentials_1.askBluescapeCredentials)(email);
    spinner.start('Login with Bluescape');
    try {
        const token = await services_1.authService.login(username, password);
        spinner.succeed('Login Success');
        (0, conf_1.setUserInfo)({ token, email: username });
        spinner.start('Fetching user infomation');
        const { id, firstName, lastName } = await services_1.userService.getSessionUser();
        (0, conf_1.setUserInfo)({ id, firstName, lastName });
        spinner.succeed(`User ${firstName} ${lastName} Logged`);
    }
    catch (error) {
        spinner.fail(error.message);
    }
};
exports.handler = handler;
//# sourceMappingURL=login.js.map