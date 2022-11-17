import chalk from 'chalk';
import ora from 'ora';
import { getActiveProfile } from '../../conf';
import {
  emailMigrationService,
  organizationService,
  provisionLicenseService,
} from '../../services';
import { askOrganizationId } from '../emailmigration/ask-migration-information';
import { Builder, Handler } from '../user/get.types';
import { Roles } from '../user/role.types';
import { askLegacySubscriptionDetails } from './ask-provision-license-information';

export const command = 'link-external-legacy-subscription';
export const desc = 'set the license purchased for the legacy enterprise';

export const builder: Builder = (yargs) =>
  yargs.example([['$0 provisionlicense link-external-legacy-subscription']]);

export const handler: Handler = async (argv) => {
  // Loading
  const spinner = ora({
    isSilent: argv.quiet as boolean,
  });

  const {
    user: { email },
  } = getActiveProfile();

  if (!email) {
    spinner.fail(chalk.red(`No Active user found. Login to proceed.\n`));
    return;
  }

  const sessionUser = await emailMigrationService.validateSessionUserRole(
    email,
    Roles.Admin,
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
  const legacySubscriptionInput = await askLegacySubscriptionDetails();

  // Validate if the provided organization exists
  const { data, error: errInFetchingOrg } =
    await organizationService.getOrganizationById(organizationId);
  if (errInFetchingOrg) {
    spinner.fail(
      chalk.red(
        `Error in getting Organization ${organizationId} details ${errInFetchingOrg}`,
      ),
    );
    return;
  }
  const organization = (data as any)?.organization || {};
  if (!organization) {
    spinner.fail(chalk.red(`Organization ${organizationId} not found`));
    return;
  }

  const result = await provisionLicenseService.linkExternalLegacySubscription(
    organizationId,
    legacySubscriptionInput,
    [
      'createdAt',
      'interval',
      'licenseQuantity',
      'licensesCurrentlyInUse',
      'organizationStorageLimitMb',
      'mode',
      'planName',
      'updatedAt',
    ],
  );

  if (result.errors) {
    spinner.fail(chalk.red(JSON.stringify(result)));
    return;
  }
  spinner.succeed(chalk.green('Linked the subscription to the organization!'));
  spinner.succeed(chalk.green(JSON.stringify(result)));
};
