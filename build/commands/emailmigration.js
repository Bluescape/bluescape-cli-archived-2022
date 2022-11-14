"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.builder = exports.desc = exports.command = void 0;
exports.command = 'emailmigration <command>';
exports.desc = 'Migrate email address of the user to SSO domain';
const builder = (yargs) => yargs.commandDir('emailmigration');
exports.builder = builder;
const handler = (_argv) => { console.log('email migration'); };
exports.handler = handler;
//# sourceMappingURL=emailmigration.js.map