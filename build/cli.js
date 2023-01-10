#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const handleError_1 = __importDefault(require("./handleError"));
(0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
    .commandDir('commands')
    .command('$0', 'The Bluescape CLI usage', () => undefined, () => {
    yargs_1.default.showHelp();
})
    .alias({ h: 'help' })
    .epilogue('For more information, check https://bluescape.com')
    .fail(handleError_1.default).argv;
//# sourceMappingURL=cli.js.map