"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.builder = exports.desc = exports.command = void 0;
exports.command = 'customlink <command>';
exports.desc = 'Add/Update custom links to the user';
const builder = (yargs) => yargs.commandDir('customlink');
exports.builder = builder;
const handler = (_argv) => { console.log('custom link'); };
exports.handler = handler;
//# sourceMappingURL=customlink.js.map