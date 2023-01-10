"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.builder = exports.desc = exports.command = void 0;
exports.command = 'provisionlicense <command>';
exports.desc = 'set license purchased for legacy enterprise';
const builder = (yargs) => yargs.commandDir('provisionlicense');
exports.builder = builder;
const handler = (_argv) => {
    console.log('provision license');
};
exports.handler = handler;
//# sourceMappingURL=provisonlicense.js.map