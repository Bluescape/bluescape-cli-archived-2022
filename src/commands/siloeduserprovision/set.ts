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

  if (!organizationId && !accountId) {
    throw new Error(
      'Request cannot be empty. Please pass organizationId/accountId.',
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
  let totalOrganizationsCount = 0;

  try {
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
          if (organizationId) {
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
          }
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
              failedOrgAccountWithReasons.push({
                organizationId: organization?.id,
                message,
              });
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

  const failedListCount =
    failedOrgAccountWithReasons.length + failedOrgIDPWithReasons.length;

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
    let field;
    if (organizationId) {
      field = 'autoAssociateIdentityProviderUser';
    }
    if (accountId) {
      field += 'account';
    }
    spinner.succeed(
      chalk.green(
        `All organizations are updated with their ${field} field, Successful count - ${totalOrganizationsCount}\n`,
      ),
    );
  } else {
    if (organizationId) {
      spinner.succeed(
        chalk.green(
          `Success to update organization IDP user flag: ${
            totalOrganizationsCount - failedOrgIDPWithReasons.length
          }\n`,
        ),
      );
      spinner.fail(
        chalk.red(
          `Failed to update organization IDP user flag:  ${failedOrgIDPWithReasons.length}\n`,
        ),
      );
    }
    if (accountId) {
      spinner.succeed(
        chalk.green(
          `Success count account mapped for organizations: ${
            totalOrganizationsCount - failedOrgAccountWithReasons.length
          }\n`,
        ),
      );
      spinner.fail(
        chalk.red(
          `Failed count to mapped account for organizations:  ${failedOrgAccountWithReasons.length}\n`,
        ),
      );
    }
  }
};
