import chalk from 'chalk';
import ora from 'ora';
import validator from 'validator';
import { customLinkService, userService } from '../../services';
import { getJsonFromCSV } from '../../utils/csv';
import { Builder, Handler } from '../user/get.types';
import {
  CreateCustomLinkProps,
  CustomLinkResourceType,
} from './custom-link.types';

export const command = 'add';
export const desc = 'Set customlink for user from csv file';

export const builder: Builder = (yargs) =>
  yargs.example([
    ['$0 customlink add --from-csv=xx.csv --blocked-domains=blocked.csv'],
  ]);

const toFindDuplicateElements = (ele: string[]) =>
  ele.filter((item, index) => ele.indexOf(item) !== index);

const csvFileDataValidation = (users: Array<Record<string, string>>): void => {
  // Finding duplicates in user array
  const emails: string[] = [];
  const roomNames: string[] = [];
  users.forEach((user) => {
    emails.push(user['Email']);
    roomNames.push(user['Room Name']);
  });

  if (emails.length === 0 || roomNames.length === 0) {
    throw new Error(
      `CSV file is empty. Please provide atleast one user and room name.`,
    );
  }

  if (emails.length !== roomNames.length) {
    throw new Error(`Please provide equal number of room name and email.`);
  }

  // Find out email duplicates
  const duplicateEmails = toFindDuplicateElements(emails);
  if (duplicateEmails.length > 0) {
    throw new Error(
      `CSV file contains the duplicate email(s) - ${duplicateEmails.concat(
        '\n',
      )}`,
    );
  }

  // Find out room name duplicates
  const duplicateRoomNames = toFindDuplicateElements(roomNames);
  if (duplicateRoomNames.length > 0) {
    throw new Error(
      `CSV file contains the duplicate room name(s) - ${duplicateRoomNames.concat(
        '\n',
      )}`,
    );
  }
};

export const handler: Handler = async (argv) => {
  const startTime = performance.now();

  let blockedDomainsList = [];

  // Get CSV file as an argument.
  const { fromCsv, blockedDomains } = argv;

  // CSV argument is missing
  if (!fromCsv) {
    throw new Error('CSV file path not proivided --from-csv=yy.csv');
  }

  // Loading
  const spinner = ora({
    isSilent: argv.quiet as boolean,
  });

  // get user json from csv
  const users = await getJsonFromCSV(fromCsv as string);

  csvFileDataValidation(users);

  const totalUsersCount = users.length;

  const failedUserWithReasons = [];

  // get blocked domains list json from csv
  if (blockedDomains) {
    const blockedDomainsListJson = await getJsonFromCSV(
      blockedDomains as string,
    );
    blockedDomainsList = blockedDomainsListJson.map(
      (values) => values['Domain Name'],
    );
  }

  for await (const [index, user] of users.entries()) {
    const { Email: userEmail, 'Room Name': roomName } = user;

    // Change the case insensitive
    const email = userEmail.toLowerCase();
    const name = roomName.toLowerCase();

    const progressing = `${index + 1}/${totalUsersCount} :  ${email}`;

    spinner.start(`${progressing} is processing..`);

    // Check email format
    // If not correct then skip and continue;

    if (!validator.isEmail(email)) {
      const message = `Invalid email format `;
      failedUserWithReasons.push({ email, message });
      spinner.fail(chalk.red(`${progressing} - ${message} \n`));
      continue;
    }

    // get custom name availability
    // If not available skip, failed notification and continue;

    const { data: linkData, errors: clAvailabilityErrors } =
      await customLinkService.getCustomLinkAvailability(name, ['isAvailable']);

    if (clAvailabilityErrors) {
      const [{ message }] = clAvailabilityErrors as any;
      failedUserWithReasons.push({ email, message });
      spinner.fail(chalk.red(`${progressing} - Failed with ${message} \n`));
      continue;
    }

    const {
      customLinkAvailability: { isAvailable },
    } = linkData;

    if (!isAvailable) {
      failedUserWithReasons.push({
        email,
        message: `${name} is not available`,
      });
      spinner.fail(
        chalk.red(
          `${progressing} - Custom link name ${name} is not available \n`,
        ),
      );
      continue;
    }

    // check the user email is in blocked list
    // If the user in blocked domain skip, failed notification and continue;

    const domain = email.substring(email.indexOf('@') + 1) as string;
    if (blockedDomainsList.includes(domain)) {
      const blockedDomainMsg = 'User exists. But in blocked domain list';
      failedUserWithReasons.push({ email, message: blockedDomainMsg });
      spinner.fail(chalk.red(`${progressing} - ${blockedDomainMsg} \n`));
      continue;
    }

    // if name is available check the user existence
    // If user does not exist then create custom link as blocked

    let userDetails: Record<string, unknown>;

    const { data, errors: userExistenceError } =
      await userService.getUserFromEmail(email, ['id']);

    if (userExistenceError) {
      const [{ message }] = userExistenceError as any;
      failedUserWithReasons.push({ email, message });
      spinner.fail(chalk.red(`${progressing} - ${message} \n`));
    }

    userDetails = (data as any)?.user || {};

    const { id: ownerId } = userDetails as any;
    let resourceId: string;

    if (ownerId) {
      // Get user has custom link
      const { data: linksData, errors: linksErrors } =
        await customLinkService.customLinks(ownerId, ['id']);

      if (linksErrors) {
        const [{ message }] = clAvailabilityErrors as any;
        failedUserWithReasons.push({ email, message });
        spinner.fail(chalk.red(`${progressing} - Failed with ${message} \n`));
        continue;
      }
      const [existingLinks] = linksData?.customLinks?.results;

      // if yes update custom link
      if (existingLinks && existingLinks?.id) {
        const updateCustomLinkPayload = {
          id: existingLinks.id,
          name,
        };
        const { errors: linkUpdateErrors } =
          await customLinkService.updateCustomLink(updateCustomLinkPayload, [
            'id',
          ]);

        if (linkUpdateErrors) {
          const [{ message }] = linkUpdateErrors as any;
          failedUserWithReasons.push({ email, message });
          spinner.fail(chalk.red(`${progressing} - ${message} \n`));
          continue;
        }

        spinner.succeed(
          chalk.green(
            `${progressing} - Custom link ${name} updated successfully! \n`,
          ),
        );
        continue;
      }

      // Create meet for user
      resourceId =
        (await customLinkService.createMeeting(name, ownerId)) ?? undefined;
    }

    // email format is correct, name available, user exist, not in blocked domain list
    // create custom link by meet and ownerId

    const createLinkPayload = {
      name,
      ownerId,
      resourceType: resourceId
        ? CustomLinkResourceType.Meet
        : CustomLinkResourceType.Blocked,
      resourceId,
    } as CreateCustomLinkProps;

    const { errors: createErrors } = await customLinkService.createCustomLink(
      createLinkPayload,
      ['name'],
    );

    if (createErrors) {
      const [{ message }] = createErrors as any;
      failedUserWithReasons.push({ email, message });
      spinner.fail(chalk.red(`${progressing} - ${message} \n`));
      continue;
    }

    spinner.succeed(
      chalk.green(
        `${progressing} - Custom link ${name} created successfully! \n`,
      ),
    );
  }

  const failedListCount = failedUserWithReasons.length;

  const endTime = performance.now();

  console.log(`\n`);

  spinner.info(
    chalk.blue(
      `Total users: ${totalUsersCount}     Execution Time: ${(
        endTime - startTime
      ).toFixed(2)} ms\n`,
    ),
  );

  if (failedListCount === 0) {
    spinner.succeed(
      chalk.green(
        `All users are updated with their custom link name, Successful count - ${totalUsersCount}\n`,
      ),
    );
  } else {
    spinner.succeed(
      chalk.green(`Passed: ${totalUsersCount - failedListCount}\n`),
    );
    spinner.fail(chalk.red(`Failed:  ${failedUserWithReasons.length}\n`));
  }
};
