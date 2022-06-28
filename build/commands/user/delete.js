"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.builder = exports.desc = exports.command = void 0;
const ora_1 = __importDefault(require("ora"));
const validator_1 = __importDefault(require("validator"));
const services_1 = require("../../services");
const csv_1 = require("../../utils/csv");
const chalk_1 = __importDefault(require("chalk"));
exports.command = 'delete [id]';
exports.desc = 'delete user id or csv file';
const builder = (yargs) => yargs
    .example([
    ['$0 user delete --from-csv=xx.csv  --new-owner-id=xx --force'],
]);
exports.builder = builder;
const handler = async (argv) => {
    const { fromCsv, newOwnerId, force } = argv;
    const ownerId = newOwnerId;
    const hardDelte = !!force;
    if (!ownerId) {
        throw new Error('New worksapce owner Id not proivided --new-owner-id=xx');
    }
    await services_1.userService.validateUser(ownerId);
    if (!fromCsv) {
        throw new Error('CSV file path not proivided --from-csv=yy.csv');
    }
    const spinner = (0, ora_1.default)({
        isSilent: argv.quiet,
    });
    const users = await (0, csv_1.getJsonFromCSV)(fromCsv);
    const faildCsv = [];
    const emailErrror = (email, message) => {
        faildCsv.push({ email, message });
        spinner.fail(`User ${email} deletion failed. ${message}`);
    };
    let i = 0;
    for (const user of users) {
        i++;
        const { email } = user;
        spinner.start(`${i}/${users.length} :  ${email} is processing..`);
        if (validator_1.default.isEmail(email)) {
            const { data: getRes, errors: getError } = await services_1.userService.getUserFromEmail(email, ['id']);
            if (getError) {
                const [{ message }] = getError;
                emailErrror(email, message);
            }
            else {
                const { user: { id: userId }, } = getRes;
                const { data: delRes, errors: delErr } = await services_1.userService.deleteUserViaGL(userId, ownerId, hardDelte);
                if (delErr) {
                    const [{ message }] = delErr;
                    emailErrror(email, message);
                }
                else {
                    spinner.succeed(`User ${email} deleted`);
                }
            }
        }
        else {
            emailErrror(email, 'Invalid Email Format');
        }
    }
    if (faildCsv.length === 0) {
        spinner.succeed(chalk_1.default.green(`AllCSV file users deleted, Total user count ${users.length}`));
    }
    else {
        spinner.fail(chalk_1.default.yellow(`${users.length - faildCsv.length} users deleted succesfully and ${faildCsv.length} users deletion faild`));
    }
};
exports.handler = handler;
//# sourceMappingURL=delete.js.map