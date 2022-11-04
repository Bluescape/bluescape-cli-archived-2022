"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.builder = exports.desc = exports.command = void 0;
const ora_1 = __importDefault(require("ora"));
const shared_1 = require("../../shared");
const conf_1 = require("../../conf");
exports.command = 'logout';
exports.desc = 'Bluescape Logout';
const builder = (yargs) => yargs.options({ ...shared_1.baseOptions }).example([['$0 logout']]);
exports.builder = builder;
const handler = async (_argv) => {
    const spinner = (0, ora_1.default)({
        isSilent: _argv.quiet,
    });
    spinner.start('Logout with Bluescape');
    try {
        (0, conf_1.deleteUserInfo)();
        spinner.succeed(`User logged out successfully.`);
    }
    catch (error) {
        spinner.fail(error.message);
    }
};
exports.handler = handler;
//# sourceMappingURL=logout.js.map