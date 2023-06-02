import chalk from 'chalk';
import ora from 'ora';
import { accountService, organizationService } from '../../services';
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

  if (!organizationId) {
    throw new Error(
      'Request cannot be empty. Please pass organizationId.',
    );
  }

  // organizationId validation
  if (organizationId && !isId(organizationId)) {
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

  const failedOrgIDPWithReasons = [];
  const failedOrgAccountWithReasons = [];
  let organizationsIDPSuccessCount = 0;
  let organizationsAccountSuccessCount = 0;

  try {
    let primaryOrganization;
    if (organizationId) {
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

      primaryOrganization = organization.data.organization;
      if (!primaryOrganization?.identityProvider) {
        spinner.fail(
          chalk.red(`Failed to get organization IDP:  ${organizationId}`),
        );
        return;
      }
    }

    if (accountId) {
      // Account exist or not.
      const account = await accountService.getAccountById(accountId as string);
      if (account.error) {
        const message =
          account.error.response.data.message || account.error.message;
        spinner.fail(
          chalk.red(`Failed to get account:  ${accountId}\nReason: ${message}`),
        );
        return;
      }
    }

    const mapOrganizations = async (nextCursor = null) => {
      // Get all the organizations
      // limit 100
      const {
        data: {
          organizations: { results, next, totalItems },
        },
      } = await organizationService.getAllOrganizations(100, nextCursor);
      nextCursor = next;

      for await (const organization of results) {
        try {
          if (
            organization?.identityProvider &&
            organization?.identityProvider?.id ===
              primaryOrganization?.identityProvider?.id
          ) {
            // Given organization autoAssociateIdentityProviderUser is false then update it to true
            if (organizationId) {
              // update organization IDP
              await organizationService.updateOrganizationAutoAssociateIDPUser(
                organization.id,
                !organization.autoAssociateIdentityProviderUser &&
                  organization.id === organizationId,
              );
              organizationsIDPSuccessCount += 1;
              spinner.succeed(
                chalk.green(
                  `Updated IDP for organization: ${organization?.id}`,
                ),
              );
            }
            // account exists then update the accounts to the all the primary / secondary organizations in the instance.
            if (accountId) {
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
                failedOrgAccountWithReasons.push({
                  organizationId: organization?.id,
                  message,
                });
              } else {
                organizationsAccountSuccessCount += 1;
                spinner.succeed(
                  chalk.blue(
                    `Updated account for organization: ${organization?.id}`,
                  ),
                );
              }
            }
          }
        } catch (e) {
          spinner.fail(
            chalk.red(
              `Failed to Update IDP for organization: ${organization?.id}`,
              e?.message,
            ),
          );
          failedOrgIDPWithReasons.push({
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

  const endTime = performance.now();

  console.log(`\n`);

  spinner.info(
    chalk.blue(`Execution Time: ${(endTime - startTime).toFixed(2)} ms\n`),
  );

  if (organizationId) {
    spinner.succeed(
      chalk.green(
        `Total no of organizations successfully updated the IDP user flag: ${organizationsIDPSuccessCount}\n`,
      ),
    );
    spinner.fail(
      chalk.red(
        `Total no of organizations failed to update organization IDP user flag:  ${failedOrgIDPWithReasons.length}\n`,
      ),
    );
  }
  if (accountId) {
    spinner.succeed(
      chalk.green(
        `Total no of organizations successfully mapped the accountId: ${organizationsAccountSuccessCount}\n`,
      ),
    );
    spinner.fail(
      chalk.red(
        `Total no of organizations failed to map the accountId:  ${failedOrgAccountWithReasons.length}\n`,
      ),
    );
  }
};
