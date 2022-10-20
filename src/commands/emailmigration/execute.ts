import chalk from 'chalk';
import ora from 'ora';
import { getActiveProfile } from '../../conf';
import {
  emailMigrationService,
  organizationService,
  userService,
} from '../../services';
import {
  csvFileDataValidation,
  validateEmail,
} from '../../services/email-migrate.service';
import { getJsonFromCSV } from '../../utils/csv';
import { valueExists } from '../../utils/validators';
import { Builder, Handler } from '../user/get.types';
import { ApplicationRole, Roles } from '../user/role.types';
import { askOrganizationId } from './ask-migration-information';

export const command = 'execute';
export const desc = 'Execute migration of member emails';

export const builder: Builder = (yargs) =>
  yargs.example([['$0 emailmigration execute --mapping-csv=xx.csv']]);

const handleErrors = (error, progressing, spinner) => {
  if (error) {
    spinner.fail(chalk.red(`${progressing} - ${error} \n`));
  }
};

export const handler: Handler = async (argv) => {
  // Loading
  const spinner = ora({
    isSilent: argv.quiet as boolean,
  });

  // Get CSV file as an argument.
  const { mappingCsv } = argv;

  // CSV argument is missing
  if (!mappingCsv) {
    throw new Error('CSV file path not proivided --mapping-csv=yy.csv');
  }

  const {
    user: { email },
  } = getActiveProfile();

  if (!email) {
    spinner.fail(chalk.red(`No Active user found. Login to proceed.\n`));
    return;
  }

  const sessionUser = await emailMigrationService.validateSessionUserUserRole(
    email,
    ApplicationRole.Admin,
  );
  if (sessionUser && sessionUser.error) {
    spinner.fail(chalk.red(`Session ${sessionUser.error}`));
    return;
  }
  // Do Not Allow to perform this Action other than Instance Admin
  if (!sessionUser) {
    spinner.fail(
      chalk.red(`Error: Forbidden. User not permitted to perform this action`),
    );
    return;
  }

  const organizationId = await askOrganizationId();

  // Validate if the provided organization exists
  const {data , error: errInFetchingOrg } = await organizationService.getOrganizationById(
    organizationId,
  );
  if (errInFetchingOrg) {
    spinner.fail(
      chalk.red(`Error in getting Organization ${organizationId} details ${errInFetchingOrg}`),
    );
    return;
  }
  const organization = (data as any)?.organization || {};
  if (!organization) {
    spinner.fail(chalk.red(`Organization ${organizationId} not found`));
    return;
  }

  // Get data as json from csv
  const mappingData = await getJsonFromCSV(mappingCsv as string);

  const mappedEmails = csvFileDataValidation(mappingData);

  const existingEmails = mappedEmails.map((data) => data.existing);

  spinner.start(`Validating Owner email existence in the Mapping CSV`);

  const orgOwner =
    await emailMigrationService.validateOrganizationOwnerExistence(
      organizationId,
      existingEmails,
    );
  if (orgOwner && orgOwner.error) {
    spinner.fail(chalk.red(`Error: ${orgOwner.error}`));
    return;
  }
  // If the owner email is not provided for mapping file, throw error and Do Not Proceed further
  if (!orgOwner) {
    spinner.fail(
      chalk.red(
        `No Owner Email information is found in the Existing Email of uploaded Mapping CSV. Please include owner details to map. We cannot proceed without owner mapping.`,
      ),
    );
    return;
  }

  spinner.start(`Started to perform migration for ${organizationId}`);
  const startTime = performance.now();

  const totalUsersCount = mappingData.length;

  const failedEmailMigrationWithReasons = [];

  for await (const [index, mappedEmail] of mappedEmails.entries()) {
    const { existing, sso, workspaceOwner } = mappedEmail;

    // Change the case insensitive
    const existingEmail = existing.toLowerCase();
    const ssoEmail = sso.toLowerCase();
    const workspaceOwnerEmail = workspaceOwner.toLowerCase();

    /**
     * Source Member - Existing Member
     * Target Member - SSO User, when exists
     */
    let sourceMember;
    let targetMember;
    let sourceMemberBelongsToManyOrgs = false;
    let targetMemberBelongsToManyOrgs = false;

    const progressing = `${index + 1}/${totalUsersCount} :  ${existingEmail}`;

    spinner.start(`${progressing} is processing..`);
  }
};
