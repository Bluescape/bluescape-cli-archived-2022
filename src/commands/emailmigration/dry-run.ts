import chalk from 'chalk';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import ora from 'ora';
import path from 'path';
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

export const command = 'dry-run';
export const desc = 'Dry run migration of member emails';

export const builder: Builder = (yargs) =>
  yargs.example([
    ['$0 emailmigration dry-run --mapping-csv=xx.csv --dry-run-csv=xx.csv'],
  ]);

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
  const { mappingCsv, dryRunCsv } = argv;

  // CSV argument is missing
  if (!mappingCsv) {
    throw new Error('CSV file path not proivided --mapping-csv=yy.csv');
  }

  // Dry run report CSV file name argument is missing
  if (!dryRunCsv) {
    throw new Error(
      'Dry run report CSV file name not provided --dry-run-csv=yy.csv',
    );
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

  // create a csv file report for email migrations
  if (!existsSync(path.join(__dirname, '../../../dry-run-report'))) {
    mkdirSync(path.join(__dirname, '../../../dry-run-report'));
  }
  const provideEmailMigrationDryRunReport = createWriteStream(
    path.resolve(
      __dirname,
      `../../../dry-run-report/${dryRunCsv}_${Date.now()}.csv`,
    ),
  );

  provideEmailMigrationDryRunReport.write(
    'Existing Email,SSO Email,Workspace Reassigning Email,Status',
  );

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

    // Check email format
    // If not correct then skip and continue;

    const validExistingEmail = validateEmail(existingEmail);
    if (validExistingEmail?.error) {
      provideEmailMigrationDryRunReport.write(
        `\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${validExistingEmail?.error} - ${existingEmail}`,
      );
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
      provideEmailMigrationDryRunReport.write(
        `\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},Error in getting Organization ${organizationId} Member - ${getOrgMember?.error}`,
      );
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
      provideEmailMigrationDryRunReport.write(
        `\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},Failed with ${message}`,
      );
      handleErrors(`Failed with ${message}`, progressing, spinner);
      continue;
    }
    // If the member exists - Check whether this User is part of only this Organization/Multiple Organization
    const getSourceMemberOrgs =
      await emailMigrationService.checkIfUserBelongsToManyOrganizations(
        sourceMember.id,
      );

    if (getSourceMemberOrgs && getSourceMemberOrgs?.error) {
      provideEmailMigrationDryRunReport.write(
        `\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},Failed to fetch existing user organizations ${getSourceMemberOrgs?.error}`,
      );
      handleErrors(
        `Failed to fetch existing user organizations ${getSourceMemberOrgs?.error}`,
        progressing,
        spinner,
      );
      continue;
    }

    if (getSourceMemberOrgs) {
      sourceMemberBelongsToManyOrgs = true;
    }

    if (ssoEmail) {
      // Check if SSO email already exists
      const validSsoEmail = validateEmail(ssoEmail);
      if (validSsoEmail?.error) {
        provideEmailMigrationDryRunReport.write(
          `\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},SSO Email - ${validSsoEmail?.error} - ${ssoEmail}`,
        );
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
        spinner.info(chalk.gray(`${progressing} - SSO ${message}.\n`));
      }

      // If SSO user exists check if it belongs to one org/multiple orgs
      targetMember = (data as any)?.user || {};

      if (valueExists(targetMember) && targetMember?.id) {
        const getTargetMemberOrgs =
          await emailMigrationService.checkIfUserBelongsToManyOrganizations(
            targetMember.id,
          );

        if (getTargetMemberOrgs && getTargetMemberOrgs?.error) {
          provideEmailMigrationDryRunReport.write(
            `\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},Failed to fetch SSO user organizations ${getTargetMemberOrgs?.error}`,
          );
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
          provideEmailMigrationDryRunReport.write(
            `\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${ssoEmail} is already used. So no email migration done`,
          );
          spinner.info(
            chalk.gray(
              `${progressing} - ${ssoEmail} is already used. So no email migration done.\n`,
            ),
          );
          continue;
        }
        // If the ExistingMember belongs to many organization
        // Need to migrate all the relationships
        provideEmailMigrationDryRunReport.write(
          `\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${ssoEmail} is already used. So no email migration done`,
        );
        spinner.info(
          chalk.gray(
            `${progressing} - ${ssoEmail} is already used. So no email migration done.\n`,
          ),
        );
      } else {
        // The SSO Email is not already present
        // If the ExistingMember doesn't belong to many organization
        // Update the Email address to SSO domain
        if (!sourceMemberBelongsToManyOrgs) {
          const reportMessage = [];
          if (sourceMember.role.type === Roles.Visitor) {
            // Update the role to member
            reportMessage.push(
              `Role updated to ${organization?.defaultOrganizationUserRole?.name}`,
            );
            spinner.info(
              chalk.gray(
                `${progressing} - ${existingEmail} role will be updated to ${organization?.defaultOrganizationUserRole?.name}\n`,
              ),
            );
          }
          reportMessage.push(
            `Existing email ${existingEmail} will be migration to ${ssoEmail}`,
          );
          provideEmailMigrationDryRunReport.write(
            `\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${reportMessage.join(
              ',',
            )}`,
          );
          continue;
        }
        /**
         * For now DO NOT do any action when the ExistingMember belongs to many organization
         */
        provideEmailMigrationDryRunReport.write(
          `\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${existingEmail} belongs to many organization. So no email update done`,
        );
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
        provideEmailMigrationDryRunReport.write(
          `\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},Organization ${organizationId} doesn't allow to have guests. Please enable the feature to convert to visitor`,
        );
        handleErrors(
          `Organization ${organizationId} doesn't allow to have guests. Please enable the feature to convert to visitor`,
          progressing,
          spinner,
        );
        continue;
      }
      if (sourceMember.role.type === Roles.Visitor) {
        provideEmailMigrationDryRunReport.write(
          `\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${existingEmail} is already a ${Roles.Visitor} in the organization`,
        );
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
          provideEmailMigrationDryRunReport.write(
            `\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${validExistingEmail.error} - ${workspaceOwnerEmail}`,
          );
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
          provideEmailMigrationDryRunReport.write(
            `\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},Error in getting Organization ${organizationId} Member - ${getOrgMember?.error}`,
          );
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
          provideEmailMigrationDryRunReport.write(
            `\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},Workspace Reassignment Email - ${workspaceOwnerEmail} is not a member of the organization`,
          );
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
          provideEmailMigrationDryRunReport.write(
            `\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${visitorRole.error}`,
          );
          handleErrors(visitorRole.error, progressing, spinner);
          continue;
        }

        if (visitorRole) {
          provideEmailMigrationDryRunReport.write(
            `\n${existingEmail},${ssoEmail},${workspaceOwnerEmail},${existingEmail} role will be updated to Visitor and his workspaces will be reassigned if any`,
          );
        }
      }
    }
  }
};
