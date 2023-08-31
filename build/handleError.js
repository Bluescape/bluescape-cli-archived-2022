"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const os_1 = require("os");
const printMessage = (message) => {
    process.stderr.write(chalk_1.default.red(`Error: ${message}`) + os_1.EOL);
    process.stderr.write(`Hint: Use the ${chalk_1.default.green('--help')} option to get help about the usage` + os_1.EOL);
};
exports.default = async (message, error) => {
    if (message) {
        printMessage(message);
        process.exit(1);
    }
    const errorMessage = error.message ? error.message : 'Unknown error occurred';
    printMessage(errorMessage);
    process.exit(1);
};
//# sourceMappingURL=handleError.js.map