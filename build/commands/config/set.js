"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.builder = exports.desc = exports.command = void 0;
const ask_instance_1 = require("./ask-instance");
const config_service_1 = require("../../services/config.service");
const conf_1 = require("../../conf");
const chalk_1 = __importDefault(require("chalk"));
exports.command = 'set [key]';
exports.desc = 'set [key]';
const builder = (yargs) => yargs.positional('key', { type: 'string' }).example([
    ['$0 config set instance'],
]);
exports.builder = builder;
const handler = async (argv) => {
    const { name, configUrl } = await (0, ask_instance_1.askInstanceDetails)();
    const { environment_config_url: config, isam, portal_api: portalApi, http_collaboration_service_address: collab, identity_api: identityApi, } = await new config_service_1.ConfigService().get(configUrl);
    (0, conf_1.addProfile)({
        name,
        active: true,
        services: { config, isam, portalApi, collab, identityApi },
    });
    console.log(chalk_1.default.green(`${name} profile added`));
};
exports.handler = handler;
//# sourceMappingURL=set.js.map