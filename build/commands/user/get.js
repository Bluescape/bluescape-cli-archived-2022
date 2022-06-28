"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.builder = exports.desc = exports.command = void 0;
const ora_1 = __importDefault(require("ora"));
const validator_1 = __importDefault(require("validator"));
const services_1 = require("../../services");
const chalk_1 = __importDefault(require("chalk"));
exports.command = "get [id]";
exports.desc = "get user by id/email";
const builder = (yargs) => yargs
    .example([
    ["$0 user get"],
    ["$0 user get -l 100 -i 10"],
    ["$0 user get {id}"],
]);
exports.builder = builder;
const handler = async (argv) => {
    const spinner = (0, ora_1.default)({
        isSilent: argv.quiet,
    });
    spinner.start(`user fetching`);
    let apiRes = null;
    const { id, attributes } = argv;
    const resAttriubutes = attributes || [
        "id",
        "firstName",
        "email",
        "lastName",
    ];
    const userKey = id;
    if (validator_1.default.isEmail(userKey)) {
        apiRes = await services_1.userService.getUserFromEmail(userKey, resAttriubutes);
    }
    else {
        apiRes = await services_1.userService.getUserById(userKey, resAttriubutes);
    }
    const { data: getRes, errors: getError } = apiRes;
    if (getError) {
        const [{ message }] = getError;
        spinner.fail(`User ${userKey} fetch failed. ${message}`);
    }
    spinner.succeed(chalk_1.default.green(JSON.stringify(getRes, null, 2)));
};
exports.handler = handler;
//# sourceMappingURL=get.js.map