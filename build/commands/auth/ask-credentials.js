"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askBluescapeCredentials = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
async function askBluescapeCredentials(email) {
    const emailPrompt = {
        name: 'username',
        type: 'input',
        message: 'Enter your Bluescape username or e-mail address:',
        validate: function (value) {
            if (value.length) {
                return true;
            }
            else {
                return 'Please enter your username or e-mail address.';
            }
        },
    };
    const passPrompt = {
        name: 'password',
        type: 'password',
        message: 'Enter your password:',
        validate: function (value) {
            if (value.length) {
                return true;
            }
            else {
                return 'Please enter your password.';
            }
        },
    };
    const result = {
        username: email,
        password: '',
    };
    let input;
    if (email) {
        input = await inquirer_1.default.prompt([passPrompt]);
    }
    else {
        input = await inquirer_1.default.prompt([emailPrompt, passPrompt]);
        result.username = input.username;
    }
    result.password = input.password;
    return result;
}
exports.askBluescapeCredentials = askBluescapeCredentials;
//# sourceMappingURL=ask-credentials.js.map