"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askInstanceDetails = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
async function askInstanceDetails() {
    const prompt = [
        {
            name: 'name',
            type: 'input',
            message: 'Enter Instance name (us):',
            validate: function (value) {
                if (value.length) {
                    return true;
                }
                else {
                    return 'Please enter instance name like us';
                }
            },
        },
        {
            name: 'configUrl',
            type: 'input',
            message: 'Enter config url (https://config.apps.us.bluescape.com/):',
            validate: function (value) {
                if (value.length) {
                    return true;
                }
                else {
                    return 'Please enter config url';
                }
            },
        },
    ];
    return inquirer_1.default.prompt(prompt);
}
exports.askInstanceDetails = askInstanceDetails;
//# sourceMappingURL=ask-instance.js.map