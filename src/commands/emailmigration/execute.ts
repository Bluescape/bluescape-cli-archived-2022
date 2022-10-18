import chalk from 'chalk';
import ora from 'ora';
import validator from 'validator';
import { getActiveProfile } from '../../conf';
import { organizationService, userService } from '../../services';
import { csvFileDataValidation } from '../../services/email-migrate.service';
import { getJsonFromCSV } from '../../utils/csv';
import { Builder, Handler } from '../user/get.types';
import { ApplicationRole, Roles } from '../user/role.types';
import { askOrganizationId } from './ask-migration-information';

export const command = 'execute';
export const desc = 'Execute migration of member emails';

export const builder: Builder = (yargs) =>
  yargs.example([['$0 emailmigration execute --mapping-csv=xx.csv']]);

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
  console.log('\n\n email==> ', email);
  let sessionUser: any;

  const { data } = await userService.getUserFromEmail(email, [
    'id',
    'applicationRole{type}',
  ]);

  sessionUser = (data as any)?.user || {};
  console.log('\n\n sessionUser?.applicationRole?.type ==>', sessionUser?.applicationRole?.type);
  // Do Not Allow to perform this Action other than Instance Admin
  if (sessionUser?.applicationRole?.type !== ApplicationRole.Admin) {
    spinner.fail(
      chalk.red(`Error: Forbidden. User not permitted to perform this action`),
    );
    return;
  }
  const organizationId = await askOrganizationId();

  // Validate if the provided organization exists
  const organization = await organizationService.getOrganizationById(
    organizationId,
    ['id', 'canHaveGuests', 'isGuestInviteApprovalRequired'],
  );
  if (organization.error) {
    spinner.fail(
      chalk.red(`Error in getting Organization ${organizationId} details`),
    );
    return;
  }
  if (!organization?.data) {
    spinner.fail(chalk.red(`Organization ${organizationId} not found`));
    return;
  }

  // Get data as json from csv
  const mappingData = await getJsonFromCSV(mappingCsv as string);

  const mappedEmails = csvFileDataValidation(mappingData);

  const existingEmails = mappedEmails.map((data) => data.existing);

  let orgOwner;
  spinner.start(`Validating Owner email existence in the Mapping CSV`);

  const getOrgOwner = await organizationService.getOrganizationOwner(
    organizationId,
    ['id', 'email'],
  );
  if (getOrgOwner.error) {
    spinner.fail(
      chalk.red(`Error in getting Organization ${organizationId} Owner`),
    );
    return;
  }
  orgOwner = (getOrgOwner.data as any)?.organization || {};

  let orgOwnerEmail;
  if (orgOwner?.members?.results && orgOwner?.members?.results.length > 0) {
    orgOwnerEmail = orgOwner.members.results[0].member.email;
  }
  // If the owner email is not provided for migration, throw error and Do Not Proceed further
  if (!existingEmails.includes(orgOwnerEmail)) {
    spinner.fail(
      chalk.red(
        `No Owner Email information is found in the Existing Email of uploaded Mapping CSV. Please include owner details to map. We cannot proceed without owner mapping.`,
      ),
    );
    return;
  }

  spinner.start(`Started to perform migration in ${organizationId}`);
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
     * Target Memeber - SSO User, when he exists
     */
    let sourceMember;
    let targetMember;
    let sourceMemberBelongsToManyOrgs = false;
    let targetMemberBelongsToManyOrgs = false;

    const progressing = `${index + 1}/${totalUsersCount} :  ${existingEmail}`;

    spinner.start(`${progressing} is processing..`);

    // Check email format
    // If not correct then skip and continue;

    if (!validator.isEmail(email)) {
      const message = `Invalid email format `;
      failedEmailMigrationWithReasons.push({
        existingEmail,
        ssoEmail,
        workspaceOwnerEmail,
        message,
      });
      spinner.fail(chalk.red(`${progressing} - ${message} \n`));
      continue;
    }

    // Get existing email member available in the organization
    // If not available skip, failed notification and continue;
    const userAttributes = ['id', 'email'];
    const roleAttributes = ['id', 'type'];
    const getOrgMember = await organizationService.getOrganizationMemberByEmail(
      organizationId,
      existingEmail,
      userAttributes,
      roleAttributes,
    );

    if (getOrgMember.error) {
      spinner.fail(
        chalk.red(`Error in getting Organization ${organizationId} Member`),
      );
      return;
    }

    const orgMember =
      (getOrgMember.data as any)?.organization?.members?.results || [];

    if(orgMember.length > 0) {
      sourceMember = {
        id: orgMember[0].member.id,
        email: orgMember[0].member.email,
        role: {
          id: orgMember[0].organizationRole.id,
          type: orgMember[0].organizationRole.type,
        },
      };
    }
    
    console.log('\n\n existingMember ==>', sourceMember);
    if (!sourceMember) {
      const message = `${existingEmail} is not a member of the organization ${organizationId}`;
      failedEmailMigrationWithReasons.push({
        existingEmail,
        ssoEmail,
        workspaceOwnerEmail,
        message,
      });
      spinner.fail(chalk.red(`${progressing} - Failed with ${message} \n`));
      continue;
    }
    // If the member exists - Check whether this User is part of only this Organization/Multiple Organization
    let userOrgs = [];

    const getUserOrgs = await userService.getUserOrganizations(
      sourceMember.id,
      100,
    );
    if (getUserOrgs.error) {
      failedEmailMigrationWithReasons.push({
        existingEmail,
        ssoEmail,
        workspaceOwnerEmail,
        message: getUserOrgs.error,
      });
      spinner.fail(
        chalk.red(
          `${progressing} - Failed to fetch user organizations ${getUserOrgs.error} \n`,
        ),
      );
      continue;
    }
    userOrgs = (getUserOrgs.data as any)?.organizations || [];
    if (userOrgs && userOrgs.length > 1) {
      sourceMemberBelongsToManyOrgs = true;
    }
    if (ssoEmail) {
      // Check if SSO email already exists

      if (!validator.isEmail(ssoEmail)) {
        const message = `Invalid email format `;
        failedEmailMigrationWithReasons.push({
          existingEmail,
          ssoEmail,
          workspaceOwnerEmail,
          message,
        });
        spinner.fail(chalk.red(`${progressing} - SSO Email - ${message} \n`));
        continue;
      }

      const { data, errors: ssoUserExistenceError } =
        await userService.getUserFromEmail(ssoEmail, ['id']);

      // If exists check if it belongs to one org/multiple orgs
      if (ssoUserExistenceError) {
        const [{ message }] = ssoUserExistenceError as any;
        failedEmailMigrationWithReasons.push({
          existingEmail,
          ssoEmail,
          workspaceOwnerEmail,
          message,
        });
        spinner.fail(chalk.red(`${progressing} - SSO ${message} \n`));
        continue;
      }

      targetMember = (data as any)?.user || {};

      if (targetMember.id) {
        let ssoUserOrgs = [];
        const getSsoUserOrgs = await userService.getUserOrganizations(
          targetMember.id,
          100,
        );
        if (getSsoUserOrgs.error) {
          spinner.fail(
            chalk.red(
              `${progressing} - Failed to fetch SSO user organizations ${getSsoUserOrgs.error} \n`,
            ),
          );
          continue;
        }
        ssoUserOrgs = (getSsoUserOrgs.data as any)?.organizations || [];

        if (ssoUserOrgs && ssoUserOrgs.length > 1) {
          targetMemberBelongsToManyOrgs = true;
        }
      } else {
        if (!sourceMemberBelongsToManyOrgs && !targetMember) {
          console.log('\n\n Into Update Email ==');
          // If the ExistingMember doesn't belong to many organization, and the SSO Email is not already present
          // Update the Email address to SSO domain
          if (sourceMember.role.type !== Roles.Visitor) {
            const updateUserEmail = await userService.updateUserEmail(
              sourceMember.id,
              targetMember.email,
              ['id', 'email'],
            );
            if (updateUserEmail.error) {
              spinner.fail(
                chalk.red(
                  `${progressing} - Failed to update user email ${updateUserEmail.error} \n`,
                ),
              );
              continue;
            }
          }
        }
      }
    } else {
      /**
       * If the SSO mapping email is not provided
       * Convert the User to Visitor
       * If the Workspace Owner Email is provided, move it to that user, otherwise move this worksapce to Organization Owner
       */
    }
  }
};
