"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askOrganizationId = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const validators_1 = require("../../utils/validators");
async function askOrganizationId() {
    const organizationPrompt = {
        name: 'organizationId',
        type: 'input',
        message: 'Enter the Organization Id:',
        validate: function (value) {
            if ((0, validators_1.isId)(value)) {
                return true;
            }
            else {
                return 'Please enter valid organizationId.';
            }
        },
    };
    const input = await inquirer_1.default.prompt([organizationPrompt]);
    return input.organizationId;
}
exports.askOrganizationId = askOrganizationId;
//# sourceMappingURL=ask-migration-information.js.map