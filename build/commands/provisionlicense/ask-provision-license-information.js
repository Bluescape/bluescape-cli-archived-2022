"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askLegacySubscriptionDetails = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const validators_1 = require("../../utils/validators");
async function askLegacySubscriptionDetails() {
    const legacySubscriptionInputPrompt = [
        {
            name: 'externalSubscriptionId',
            type: 'input',
            message: 'Enter the external subscription Id:',
            validate: function (value) {
                if ((0, validators_1.isExternalSubscriptionId)(value)) {
                    return true;
                }
                else {
                    return 'Please enter valid external subscription Id';
                }
            },
        },
        {
            name: 'externalSubscriptionVersion',
            type: 'input',
            message: 'Enter the external subscription version:',
            validate: function (value) {
                if ((0, validators_1.isNumber)(value)) {
                    return true;
                }
                else {
                    return 'Please enter valid external subscription version';
                }
            },
        },
        {
            name: 'licenseQuantity',
            type: 'input',
            message: 'Enter the license quantity:',
            validate: function (value) {
                if ((0, validators_1.isNumber)(value) || !value.length) {
                    return true;
                }
                else {
                    return 'Please enter valid license quantity';
                }
            },
        },
        {
            name: 'currency',
            type: 'list',
            choices: ['USD'],
            message: 'Enter currency:',
            default: 'USD',
        },
        {
            name: 'interval',
            type: 'list',
            choices: ['Yearly', 'Monthly'],
            message: 'Enter interval:',
            default: 'Yearly',
        },
        {
            name: 'organizationStorageLimitMb',
            type: 'input',
            message: 'Enter organization storage limit Mb:',
            validate: function (value) {
                if ((0, validators_1.isNumber)(value) || !value.length) {
                    return true;
                }
                else {
                    return 'Please enter valid organization storage limit Mb';
                }
            },
        },
    ];
    return inquirer_1.default.prompt(legacySubscriptionInputPrompt);
}
exports.askLegacySubscriptionDetails = askLegacySubscriptionDetails;
//# sourceMappingURL=ask-provision-license-information.js.map