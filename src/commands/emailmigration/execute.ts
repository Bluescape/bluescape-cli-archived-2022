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
import { Roles } from '../user/role.types';
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

  let failedEmailMigrationWithReasons = 0;

  for await (const [index, mappedEmail] of mappedEmails.entries()) {
    const {
      existing: existingEmail,
      sso: ssoEmail,
      workspaceOwner: workspaceOwnerEmail,
    } = mappedEmail;

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

    // Check email format
    // If not correct then skip and continue;

    const validExistingEmail = validateEmail(email);
    if (validExistingEmail?.error) {
      failedEmailMigrationWithReasons++;
      handleErrors(validExistingEmail.error, progressing, spinner);
      continue;
    }

    // Get existing email member available in the organization
    // If not available skip, failed notification and continue;
    const getOrgMember =
      await emailMigrationService.getOrganizationMemberByEmail(
        organizationId,
        existingEmail,
      );

    if (getOrgMember && getOrgMember?.error) {
      failedEmailMigrationWithReasons++;
      handleErrors(
        `Error in getting Organization ${organizationId} Member - ${getOrgMember?.error}`,
        progressing,
        spinner,
      );
      continue;
    }
    if (valueExists(getOrgMember) && getOrgMember.id) {
      sourceMember = getOrgMember;
    }

    if (!sourceMember) {
      const message = `${existingEmail} is not a member of the organization ${organizationId}`;
      failedEmailMigrationWithReasons++;
      handleErrors(`Failed with ${message}`, progressing, spinner);
      continue;
    }
    // If the member exists - Check whether this User is part of only this Organization/Multiple Organization
    const getSourceMemberOrgs =
      await emailMigrationService.checkIfUserBelongsToManyOrganizations(
        sourceMember.id,
      );

    if (getSourceMemberOrgs && getSourceMemberOrgs?.error) {
      handleErrors(getSourceMemberOrgs?.error, progressing, spinner);
      continue;
    }

    if (getSourceMemberOrgs) {
      sourceMemberBelongsToManyOrgs = true;
    }

    if (ssoEmail) {
      // Check if SSO email already exists
      const validSsoEmail = validateEmail(ssoEmail);
      if (validSsoEmail?.error) {
        failedEmailMigrationWithReasons++;
        handleErrors(
          `SSO Email - ${validSsoEmail?.error}`,
          progressing,
          spinner,
        );
        continue;
      }

      const { data, errors: ssoUserExistenceError } =
        await userService.getUserFromEmail(ssoEmail, ['id']);

      if (ssoUserExistenceError) {
        const [{ message }] = ssoUserExistenceError as any;
        failedEmailMigrationWithReasons++;
        handleErrors(`SSO ${message}`, progressing, spinner);
      }

      // If SSO user exists check if it belongs to one org/multiple orgs
      targetMember = (data as any)?.user || {};

      if (valueExists(targetMember) && targetMember?.id) {
        const getTargetMemberOrgs =
          await emailMigrationService.checkIfUserBelongsToManyOrganizations(
            targetMember.id,
          );

        if (getTargetMemberOrgs && getTargetMemberOrgs?.error) {
          handleErrors(
            `Failed to fetch SSO user organizations ${getTargetMemberOrgs.error}`,
            progressing,
            spinner,
          );
          continue;
        }
        if (getTargetMemberOrgs) {
          targetMemberBelongsToManyOrgs = true;
        }
        // The SSO Email already present
        // If the SSO Member doesn't belong to many organization
        if (!targetMemberBelongsToManyOrgs) {
          // Need to migrate all the relationships
          // Delete the sourceMember
        }
        // If the ExistingMember belongs to many organization
        // Need to migrate all the relationships
      } else {
        // The SSO Email is not already present
        // If the ExistingMember doesn't belong to many organization
        // Update the Email address to SSO domain
        if (!sourceMemberBelongsToManyOrgs) {
          if (sourceMember.role.type === Roles.Visitor) {
            // Update the role to member
            const updateMemberRole =
              await organizationService.updateOrganizationMemberRole(
                sourceMember.id,
                organizationId,
                organization?.defaultOrganizationUserRole?.id,
              );
            if (updateMemberRole?.error) {
              handleErrors(updateMemberRole.error, progressing, spinner);
              continue;
            }
            spinner.info(
              chalk.gray(
                `${progressing} - Updated ${existingEmail} role to ${organization?.defaultOrganizationUserRole?.name}\n`,
              ),
            );
          }
          const updateUserEmail = await userService.updateUserEmail(
            sourceMember.id,
            ssoEmail,
            ['id', 'email'],
          );
          if (updateUserEmail.error) {
            handleErrors(
              `Failed to update user email ${updateUserEmail.error}`,
              progressing,
              spinner,
            );
          }
          continue;
        }
        /**
         * For now DO NOT do any action when the ExistingMember belongs to many organization
         */

        spinner.info(
          chalk.gray(
            `${progressing} - ${existingEmail} belongs to many organization. So no email update done.\n`,
          ),
        );
        // If the ExistingMember belongs to many organization
        // Split the User Accounts

        // Migrate all the resources to this new user from the Existing user
      }
    } else {
      /**
       * If the SSO mapping email is not provided
       * Convert the User to Visitor
       * If the Workspace Owner Email is provided, move it to that user, otherwise move this worksapce to Organization Owner
       */
      // Check if this user has owned workspaces
      if (!organization?.canHaveGuests) {
        handleErrors(
          `Organization ${organizationId} doesn't allow to have guests. Please enable the feature to convert to visitor`,
          progressing,
          spinner,
        );
        continue;
      }
      if (sourceMember.role.type === Roles.Visitor) {
        handleErrors(
          `${existingEmail} is already a ${Roles.Visitor} in the organization`,
          progressing,
          spinner,
        );
        continue;
      }
      let newOwner;
      if (workspaceOwnerEmail) {
        // Should be a valid email
        const validExistingEmail = validateEmail(workspaceOwnerEmail);
        if (validExistingEmail?.error) {
          failedEmailMigrationWithReasons++;
          handleErrors(validExistingEmail.error, progressing, spinner);
          continue;
        }

        // Get owner email - is a member in the organization
        // If not available skip, failed notification and continue;
        const getOrgMember =
          await emailMigrationService.getOrganizationMemberByEmail(
            organizationId,
            workspaceOwnerEmail,
          );

        if (getOrgMember && getOrgMember?.error) {
          failedEmailMigrationWithReasons++;
          handleErrors(
            `Error in getting Organization ${organizationId} Member - ${getOrgMember?.error}`,
            progressing,
            spinner,
          );
          continue;
        }
        if (valueExists(getOrgMember) && getOrgMember.id) {
          newOwner = getOrgMember;
        } else {
          failedEmailMigrationWithReasons++;
          handleErrors(
            `Workspace Reassignment Email - ${workspaceOwnerEmail} is not a member of the organization`,
            progressing,
            spinner,
          );
          continue;
        }

        // Get Visitor Role Id
        const visitorRole =
          await emailMigrationService.getOrganizationVisitorRoleId(
            organizationId,
          );

        if (visitorRole?.error) {
          failedEmailMigrationWithReasons++;
          handleErrors(visitorRole.error, progressing, spinner);
          continue;
        }

        if (visitorRole) {
          const updateMemberRole =
            newOwner && newOwner?.id
              ? await organizationService.updateOrganizationMemberRole(
                  sourceMember.id,
                  organizationId,
                  visitorRole,
                  newOwner.id,
                )
              : await organizationService.updateOrganizationMemberRole(
                  sourceMember.id,
                  organizationId,
                  visitorRole,
                );
          if (updateMemberRole?.error) {
            handleErrors(updateMemberRole.error, progressing, spinner);
            continue;
          }
          const reassignedOwner = workspaceOwnerEmail ? workspaceOwnerEmail : 'Organization Owner';
          spinner.info(
            chalk.gray(
              `${progressing} - Updated ${existingEmail} role to visitor and reassigned his worksapces to ${reassignedOwner}\n`,
            ),
          );
        }
      }
    }
  }

  const endTime = performance.now();

  console.log(`\n`);

  spinner.info(
    chalk.blue(
      `Total users: ${totalUsersCount}     Execution Time: ${(
        endTime - startTime
      ).toFixed(2)} ms\n`,
    ),
  );
  if (failedEmailMigrationWithReasons === 0) {
    spinner.succeed(
      chalk.green(
        `All users email has been migrated, Successful count - ${totalUsersCount}\n`,
      ),
    );
  } else {
    spinner.succeed(
      chalk.green(
        `Passed: ${totalUsersCount - failedEmailMigrationWithReasons}\n`,
      ),
    );
    spinner.fail(chalk.red(`Failed:  ${failedEmailMigrationWithReasons}\n`));
  }
};
