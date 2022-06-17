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
  yargs.example([['$0 customlink add --from-csv=xx.csv']]);

const blockedDomains = ['encoress.com'];

export const handler: Handler = async (argv) => {
  const startTime = performance.now();

  // Get CSV file as an argument.
  const { fromCsv } = argv;

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

  const toFindDuplicateElements = (ele: string[]) =>
    ele.filter((item, index) => ele.indexOf(item) !== index);

  // Finding duplicates in user array
  const emails: string[] = [];
  const roomNames: string[] = [];
  users.forEach((user) => {
    emails.push(user['Email']);
    roomNames.push(user['Room Name']);
  });

  // Find out email duplicates
  const dupliacteEmails = toFindDuplicateElements(emails);
  if (dupliacteEmails.length > 0) {
    throw new Error(
      `CSV file contains the duplicate email(s) - ${dupliacteEmails.concat(
        '\n'
      )}`
    );
  }

  // Find out room name duplicates
  const dupliacteRoomNames = toFindDuplicateElements(roomNames);
  if (dupliacteRoomNames.length > 0) {
    throw new Error(
      `CSV file contains the duplicate room name(s) - ${dupliacteRoomNames.concat(
        '\n'
      )}`
    );
  }

  const failedUserWithReasons = [];

  for await (const [index, user] of users.entries()) {
    const progressing = index + 1;

    const { Email: email, 'Room Name': name } = user;
    spinner.start(`${progressing}/${users.length} :  ${email} is processing..`);

    // Check email format
    // If not correct then skip and continue;

    if (!validator.isEmail(email)) {
      spinner.fail(
        chalk.red(
          `${progressing}/${users.length} : ${email} - Invalid email format \n`
        )
      );
      continue;
    }

    // get custom name availability
    // If not available skip, failed notification and continue;

    const { data: linkData, errors: clAvailabilityErrors } =
      await customLinkService.getCustomLinkAvailability(name, ['isAvailable']);

    if (clAvailabilityErrors) {
      const [{ message }] = clAvailabilityErrors as any;
      failedUserWithReasons.push({ email, message });
      spinner.fail(
        chalk.red(
          `${progressing}/${users.length} : ${email} - Failed with ${message} \n`
        )
      );
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
          `${progressing}/${users.length} : ${email} - Custom link name ${name} is not available \n`
        )
      );
      continue;
    }

    // if available check the user existence
    // If user does not exist then create custom link as blocked

    const { data: userData, errors: userExistenceError } =
      await userService.getUserFromEmail(email, ['id']);

    if (userExistenceError) {
      const [{ message }] = userExistenceError as any;
      failedUserWithReasons.push({ email, message });
      spinner.fail(
        chalk.red(`${progressing}/${users.length} : ${email} - ${message} \n`)
      );
      continue;
    }

    // check the user email is in blocked list
    // If the user in blocked domain skip, failed notification and continue;

    const domain = email.substring(email.indexOf('@') + 1);

    if (domain.includes(blockedDomains)) {
      const blockedDomainMsg = 'User exists. But in blocked domain list';
      failedUserWithReasons.push({ email, message: blockedDomainMsg });
      spinner.fail(
        chalk.red(
          `${progressing}/${users.length} : ${email} - ${blockedDomainMsg} \n`
        )
      );
      continue;
    }

    // Get user has custom link

    const {
      user: { id: ownerId },
    } = userData as any;

    const { data: linksData, errors: linksErrors } =
      await customLinkService.customLinks(ownerId, ['id']);

    if (linksErrors) {
      const [{ message }] = clAvailabilityErrors as any;
      failedUserWithReasons.push({ email, message });
      spinner.fail(
        chalk.red(
          `${progressing}/${users.length} : ${email} - Failed with ${message} \n`
        )
      );
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
        spinner.fail(
          chalk.red(`${progressing}/${users.length} : ${email} - ${message} \n`)
        );
        continue;
      }

      spinner.succeed(
        chalk.green(
          `${progressing}/${users.length} : ${email} - Custom link ${name} updated successfully! \n`
        )
      );
      continue;
    }

    // email format is correct, name available, user exist, not in blocked domain list
    // create custom link by meet and ownerId

    const createLinkPayload = {
      name,
      ownerId,
      resourceType: CustomLinkResourceType.Blocked,
    } as CreateCustomLinkProps;

    const { errors: createErrors } = await customLinkService.createCustomLink(
      createLinkPayload,
      ['name']
    );

    if (createErrors) {
      const [{ message }] = createErrors as any;
      failedUserWithReasons.push({ email, message });
      spinner.fail(
        chalk.red(`${progressing}/${users.length} : ${email} - ${message} \n`)
      );
      continue;
    }

    spinner.succeed(
      chalk.green(
        `${progressing}/${users.length} : ${email} - Custom link ${name} created successfully! \n`
      )
    );
  }

  const failedListCount = failedUserWithReasons.length;
  const totalListCount = users.length;

  const endTime = performance.now();

  console.log(`\n`);

  spinner.info(
    chalk.blue(
      `Total users: ${totalListCount}     Execution Time: ${(
        endTime - startTime
      ).toFixed(2)} ms\n`
    )
  );

  if (failedListCount === 0) {
    spinner.succeed(
      chalk.green(
        `All users are updated with their custom link name, Successful count - ${totalListCount}\n`
      )
    );
  } else {
    spinner.succeed(
      chalk.green(`Passed: ${totalListCount - failedListCount}\n`)
    );
    spinner.fail(chalk.red(`Failed:  ${failedUserWithReasons.length}\n`));
  }
};
