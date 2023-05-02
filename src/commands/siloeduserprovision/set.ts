import chalk from 'chalk';
import ora from 'ora';
import { organizationService } from '../../services';
import { isId } from '../../utils/validators';
import { Builder, Handler } from '../user/get.types';

export const command = 'set';
export const desc = 'Siloed user provisioning';

export const builder: Builder = (yargs) =>
  yargs.example([
    [
      '$0 siloeduserprovision set --organizationId="organizationId" --accountId="accountId"',
    ],
  ]);

export const handler: Handler = async (argv) => {
  const startTime = performance.now();

  // Get the arguments
  const { organizationId, accountId } = argv;

  // organizationId validation
  if (!organizationId) {
    throw new Error('Please pass the organization id');
  } else if (organizationId && !isId(organizationId)) {
    throw new Error('Invalid organizationId. Value must be a valid Id');
  }

  // accountId validation
  if (accountId && !isId(accountId)) {
    throw new Error('Invalid accountId. Value must be a valid Id');
  }

  // Loading
  const spinner = ora({
    isSilent: argv.quiet as boolean,
  });

  const failedUserWithReasons = [];
  let totalOrganizationsCount = 0;

  try {
    // Organization exist or not.
    const organization = await organizationService.getOrganizationById(
      organizationId as string,
    );

    if (organization.errors) {
      spinner.fail(
        chalk.red(
          `Failed to get organization:  ${organizationId}\nReason: ${organization.errors[0].message}`,
        ),
      );
      return;
    }

    const mapOrganizations = async (nextCursor = null) => {
      // Get all the organizations
      // limit 100
      const {
        data: {
          organizations: { results, next, totalItems },
        },
      } = await organizationService.getAllOrganizations(
        100,
        nextCursor,
        nextCursor === null,
      );
      // Assigned the total organizations
      // totalItems prop get the first time only
      totalOrganizationsCount = totalItems || totalOrganizationsCount;
      nextCursor = next;

      for await (const organization of results) {
        try {
          // Given organization autoAssociateIdentityProviderUser is false then update it to true
          if (
            !organization.autoAssociateIdentityProviderUser &&
            organization.id === organizationId
          ) {
            await organizationService.updateOrganizationAutoAssociateIDPUser(
              organization.id,
              true,
            );
          } else {
            //
            await organizationService.updateOrganizationAutoAssociateIDPUser(
              organization.id,
              false,
            );
          }
          spinner.succeed(
            chalk.green(`Updated IDP for organization: ${organization?.id}`),
          );
          if (accountId) {
            // account exists then update the accounts to the all the organizations in the instance.
            const data = await organizationService.addOrganizationToAccount(
              organization?.id,
              accountId as string,
            );
            if (data.error) {
              const message = data.error.response.data.message || data.error;
              spinner.fail(
                chalk.red(
                  `Failed to update account for organization: ${organization?.id}. Reason: ${message}`,
                ),
              );
            } else {
              spinner.succeed(
                chalk.blue(
                  `Updated account for organization: ${organization?.id}`,
                ),
              );
            }
          }
        } catch (e) {
          spinner.fail(
            chalk.red(
              `Failed to Update IDP for organization: ${organization?.id}`,
            ),
          );
          failedUserWithReasons.push({
            organizationId: organization?.id,
            message: e?.message,
          });
          continue;
        }
      }
      // Check the pagination is end
      if (nextCursor && nextCursor !== null) {
        await mapOrganizations(nextCursor);
      }
    };
    await mapOrganizations();
  } catch (e) {
    spinner.fail(chalk.red(e.message));
  }

  const failedListCount = failedUserWithReasons.length;

  const endTime = performance.now();

  console.log(`\n`);

  spinner.info(
    chalk.blue(
      `Total organizations: ${totalOrganizationsCount}     Execution Time: ${(
        endTime - startTime
      ).toFixed(2)} ms\n`,
    ),
  );

  if (failedListCount === 0) {
    spinner.succeed(
      chalk.green(
        `All organizations are updated with their autoAssociateIdentityProviderUser field, Successful count - ${totalOrganizationsCount}\n`,
      ),
    );
  } else {
    spinner.succeed(
      chalk.green(`Passed: ${totalOrganizationsCount - failedListCount}\n`),
    );
    spinner.fail(chalk.red(`Failed:  ${failedUserWithReasons.length}\n`));
  }
};
