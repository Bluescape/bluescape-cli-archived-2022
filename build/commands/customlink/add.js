"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.builder = exports.desc = exports.command = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const validator_1 = __importDefault(require("validator"));
const services_1 = require("../../services");
const csv_1 = require("../../utils/csv");
const custom_link_types_1 = require("./custom-link.types");
exports.command = 'add';
exports.desc = 'Set customlink for user from csv file';
const builder = (yargs) => yargs.example([
    ['$0 customlink add --from-csv=xx.csv --blocked-domains=blocked.csv'],
]);
exports.builder = builder;
const toFindDuplicateElements = (ele) => ele.filter((item, index) => ele.indexOf(item) !== index);
const csvFileDataValidation = (users) => {
    const emails = [];
    const roomNames = [];
    users.forEach((user) => {
        emails.push(user['Email']);
        roomNames.push(user['Room Name']);
    });
    if (emails.length === 0 || roomNames.length === 0) {
        throw new Error(`CSV file is empty. Please provide atleast one user and room name.`);
    }
    if (emails.length !== roomNames.length) {
        throw new Error(`Please provide equal number of room name and email.`);
    }
    const duplicateEmails = toFindDuplicateElements(emails);
    if (duplicateEmails.length > 0) {
        throw new Error(`CSV file contains the duplicate email(s) - ${duplicateEmails.concat('\n')}`);
    }
    const duplicateRoomNames = toFindDuplicateElements(roomNames);
    if (duplicateRoomNames.length > 0) {
        throw new Error(`CSV file contains the duplicate room name(s) - ${duplicateRoomNames.concat('\n')}`);
    }
};
const handler = async (argv) => {
    const startTime = performance.now();
    let blockedDomainsList = [];
    const { fromCsv, blockedDomains } = argv;
    if (!fromCsv) {
        throw new Error('CSV file path not proivided --from-csv=yy.csv');
    }
    const spinner = (0, ora_1.default)({
        isSilent: argv.quiet,
    });
    const users = await (0, csv_1.getJsonFromCSV)(fromCsv);
    csvFileDataValidation(users);
    const totalUsersCount = users.length;
    const failedUserWithReasons = [];
    if (blockedDomains) {
        const blockedDomainsListJson = await (0, csv_1.getJsonFromCSV)(blockedDomains);
        blockedDomainsList = blockedDomainsListJson.map((values) => values['Domain Name']);
    }
    for await (const [index, user] of users.entries()) {
        const { Email: userEmail, 'Room Name': roomName } = user;
        const email = userEmail.toLowerCase();
        const name = roomName.toLowerCase();
        const progressing = `${index + 1}/${totalUsersCount} :  ${email}`;
        spinner.start(`${progressing} is processing..`);
        if (!validator_1.default.isEmail(email)) {
            const message = `Invalid email format `;
            failedUserWithReasons.push({ email, message });
            spinner.fail(chalk_1.default.red(`${progressing} - ${message} \n`));
            continue;
        }
        const { data: linkData, errors: clAvailabilityErrors } = await services_1.customLinkService.getCustomLinkAvailability(name, ['isAvailable']);
        if (clAvailabilityErrors) {
            const [{ message }] = clAvailabilityErrors;
            failedUserWithReasons.push({ email, message });
            spinner.fail(chalk_1.default.red(`${progressing} - Failed with ${message} \n`));
            continue;
        }
        const { customLinkAvailability: { isAvailable }, } = linkData;
        if (!isAvailable) {
            failedUserWithReasons.push({
                email,
                message: `${name} is not available`,
            });
            spinner.fail(chalk_1.default.red(`${progressing} - Custom link name ${name} is not available \n`));
            continue;
        }
        const domain = email.substring(email.indexOf('@') + 1);
        if (blockedDomainsList.includes(domain)) {
            const blockedDomainMsg = 'User exists. But in blocked domain list';
            failedUserWithReasons.push({ email, message: blockedDomainMsg });
            spinner.fail(chalk_1.default.red(`${progressing} - ${blockedDomainMsg} \n`));
            continue;
        }
        let userDetails;
        const { data, errors: userExistenceError } = await services_1.userService.getUserFromEmail(email, ['id']);
        if (userExistenceError) {
            const [{ message }] = userExistenceError;
            failedUserWithReasons.push({ email, message });
            spinner.fail(chalk_1.default.red(`${progressing} - ${message} \n`));
        }
        userDetails = data?.user || {};
        const { id: ownerId } = userDetails;
        let resourceId;
        if (ownerId) {
            const { data: linksData, errors: linksErrors } = await services_1.customLinkService.customLinks(ownerId, ['id']);
            if (linksErrors) {
                const [{ message }] = clAvailabilityErrors;
                failedUserWithReasons.push({ email, message });
                spinner.fail(chalk_1.default.red(`${progressing} - Failed with ${message} \n`));
                continue;
            }
            const [existingLinks] = linksData?.customLinks?.results;
            if (existingLinks && existingLinks?.id) {
                const updateCustomLinkPayload = {
                    id: existingLinks.id,
                    name,
                };
                const { errors: linkUpdateErrors } = await services_1.customLinkService.updateCustomLink(updateCustomLinkPayload, [
                    'id',
                ]);
                if (linkUpdateErrors) {
                    const [{ message }] = linkUpdateErrors;
                    failedUserWithReasons.push({ email, message });
                    spinner.fail(chalk_1.default.red(`${progressing} - ${message} \n`));
                    continue;
                }
                spinner.succeed(chalk_1.default.green(`${progressing} - Custom link ${name} updated successfully! \n`));
                continue;
            }
            resourceId =
                (await services_1.customLinkService.createMeeting(name, ownerId)) ?? undefined;
        }
        const createLinkPayload = {
            name,
            ownerId,
            resourceType: resourceId
                ? custom_link_types_1.CustomLinkResourceType.Meet
                : custom_link_types_1.CustomLinkResourceType.Blocked,
            resourceId,
        };
        const { errors: createErrors } = await services_1.customLinkService.createCustomLink(createLinkPayload, ['name']);
        if (createErrors) {
            const [{ message }] = createErrors;
            failedUserWithReasons.push({ email, message });
            spinner.fail(chalk_1.default.red(`${progressing} - ${message} \n`));
            continue;
        }
        spinner.succeed(chalk_1.default.green(`${progressing} - Custom link ${name} created successfully! \n`));
    }
    const failedListCount = failedUserWithReasons.length;
    const endTime = performance.now();
    console.log(`\n`);
    spinner.info(chalk_1.default.blue(`Total users: ${totalUsersCount}     Execution Time: ${(endTime - startTime).toFixed(2)} ms\n`));
    if (failedListCount === 0) {
        spinner.succeed(chalk_1.default.green(`All users are updated with their custom link name, Successful count - ${totalUsersCount}\n`));
    }
    else {
        spinner.succeed(chalk_1.default.green(`Passed: ${totalUsersCount - failedListCount}\n`));
        spinner.fail(chalk_1.default.red(`Failed:  ${failedUserWithReasons.length}\n`));
    }
};
exports.handler = handler;
//# sourceMappingURL=add.js.map