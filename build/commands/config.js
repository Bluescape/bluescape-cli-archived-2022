"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.builder = exports.desc = exports.command = void 0;
const chalk_1 = __importDefault(require("chalk"));
exports.command = 'config <command>';
exports.desc = 'configuration';
const builder = (yargs) => yargs.commandDir('config');
exports.builder = builder;
const handler = (_argv) => {
    console.log(chalk_1.default.red('Commmand not implemented'));
};
exports.handler = handler;
//# sourceMappingURL=config.js.map