"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.builder = exports.desc = exports.command = void 0;
exports.command = 'user <command>';
exports.desc = 'Manage user';
const builder = (yargs) => yargs.commandDir('user');
exports.builder = builder;
const handler = (_argv) => { console.log('user'); };
exports.handler = handler;
//# sourceMappingURL=user.js.map