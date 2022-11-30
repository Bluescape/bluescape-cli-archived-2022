import chalk from 'chalk';
import ora from 'ora';
import { getActiveProfile } from '../../conf';
import {
  emailMigrationService,
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

  if(result) {
    if(result?.errors) {
      spinner.fail(chalk.red(result?.errors[0]?.message));
      return;
    }
    if(result?.data?.linkExternalLegacySubscription) {
      spinner.succeed(
          chalk.green(
            `Successfully linked the external legacy subscription ${legacySubscriptionInput.externalSubscriptionId}  to the organization ${organizationId}!`,
          ),
        );
        spinner.succeed(chalk.green(JSON.stringify(result.data.linkExternalLegacySubscription)));
        return;
    }
  }
  else {
    spinner.fail(chalk.red(`Failed to fetch external legacy subscription results`));
    return;
  }
};
