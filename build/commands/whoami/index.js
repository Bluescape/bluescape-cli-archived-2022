"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.builder = exports.desc = exports.command = void 0;
const chalk_1 = __importDefault(require("chalk"));
const conf_1 = require("../../conf");
exports.command = 'whoami';
exports.desc = 'show session user';
const builder = (yargs) => yargs
    .example([['$0 whoami']]);
exports.builder = builder;
const handler = async (_argv) => {
    const { name, user: { email, firstName, lastName }, services: { config }, } = (0, conf_1.getActiveProfile)();
    if (!name) {
        console.log(chalk_1.default.red(`Active profile not found`));
    }
    else {
        console.log(chalk_1.default.green(`Instance Name: ${name}, Config: ${config} `));
        if (!email) {
            console.log(chalk_1.default.red(`User not logged`));
        }
        else {
            console.log(chalk_1.default.green(`Logged user ${firstName} ${lastName} (${email}).`));
        }
    }
};
exports.handler = handler;
//# sourceMappingURL=index.js.map