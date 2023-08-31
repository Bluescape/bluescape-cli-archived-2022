"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.builder = exports.desc = exports.command = void 0;
exports.command = 'siloeduserprovision <command>';
exports.desc = 'set organization IDP and account';
const builder = (yargs) => yargs.commandDir('siloeduserprovision');
exports.builder = builder;
const handler = (_argv) => {
    console.log('siloed user provisioning');
};
exports.handler = handler;
//# sourceMappingURL=siloeduserprovision.js.map