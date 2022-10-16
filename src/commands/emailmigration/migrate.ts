import chalk from 'chalk';
import ora from 'ora';
import { getActiveProfile } from '../../conf';
import { userService, organizationService } from '../../services';
import { Email } from '../../types';
import { getJsonFromCSV } from '../../utils/csv';
import { valueExists } from '../../utils/validators';
import { Builder, Handler } from '../user/get.types';
import { askMirgrationInformation, askOrganizationId } from './ask-migration-information';

export const command = 'migrate';
export const desc = 'Migrate member emails';

export enum ApplicationRole {
  Admin = 'Admin',
  User = 'User',
}

export const builder: Builder = (yargs) =>
  yargs.example([['$0 emailmigration migrate --mapping-csv=xx.csv']]);

const toFindDuplicateElements = (ele: string[]) =>
  ele.filter((item, index) => ele.indexOf(item) !== index);

export interface MappedEmailInformation {
  existingEmail: Email;
  ssoEmail: Email;
  workspaceOwnerEmail?: Email;
}

const csvFileDataValidation = (
  mappingData: Array<Record<string, string>>,
): MappedEmailInformation[] => {
  // Finding duplicates in user emails array
  const mappedEmails: any[] = [];
  mappingData.forEach((email) => {
    mappedEmails.push({
      existingEmail: email['Existing Email'],
      ssoEmail: email['SSO Email'],
      workspaceOwnerEmail: email['Workspace Owner Email'],
    });
  });

  const existingEmails = mappedEmails.map((data) => data.existingEmail);
  const ssoEmails = mappedEmails.map((data) => data.ssoEmail);

  if (existingEmails.length === 0 || ssoEmails.length === 0) {
    throw new Error(
      `CSV file is empty. Please provide atleast one user existing email address and sso email address to migrate.`,
    );
  }

  // Find out existing email duplicates
  const duplicateExistingEmails = toFindDuplicateElements(existingEmails);
  if (duplicateExistingEmails.length > 0) {
    throw new Error(
      `CSV file contains the duplicate existing email(s) - ${duplicateExistingEmails.concat(
        '\n',
      )}`,
    );
  }

  // Find out sso email duplicates
  const duplicateSsoEmails = toFindDuplicateElements(ssoEmails);
  if (duplicateSsoEmails.length > 0) {
    throw new Error(
      `CSV file contains the duplicate sso email(s) - ${duplicateSsoEmails.concat(
        '\n',
      )}`,
    );
  }
  return mappedEmails;
};

const getOrganizationMembers = async (
  organizationId: string,
  cursor?: string,
): Promise<any> => {
  // Loading
  const spinner = ora();
  const userAttributes = ['id', 'email'];
  const roleAttributes = ['id', 'type'];
  const pageSize = 100;
  const getOrgMembers = await organizationService.getOrganizationMembers(
    organizationId,
    userAttributes,
    roleAttributes,
    pageSize,
    cursor,
  );
  // cursor = null;
  if (getOrgMembers.error) {
    spinner.fail(
      chalk.red(`Error in getting Organization ${organizationId} Members`),
    );
    return;
  }
  const orgMembers = (getOrgMembers.data as any)?.organization?.members?.results || [];
  const nextCursor = getOrgMembers.data?.organization?.members?.next;

  if (orgMembers && orgMembers.length > 0) {
    if (valueExists(nextCursor)) {
      return orgMembers.concat(
        await getOrganizationMembers(
          organizationId,
          nextCursor,
        ),
      );
    } else {
      return orgMembers;
    }
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

  let sessionUser: any;

  const { data } = await userService.getUserFromEmail(email, [
    'id',
    'applicationRole{type}',
  ]);

  sessionUser = (data as any)?.user || {};

  // Do Not Allow to perform this Action other than Instance Admin
  if (sessionUser?.applicationRole?.type !== ApplicationRole.Admin) {
    spinner.fail(
      chalk.red(`Error: Forbidden. User not permitted to perform this action`),
    );
    return;
  }
  const organizationId = await askOrganizationId();

  // Validate if the provided organization exists
  const organization = await organizationService.getOrganizationById(organizationId, ['id', 'canHaveGuests', 'isGuestInviteApprovalRequired']);
  if (organization.error) {
    spinner.fail(
      chalk.red(`Error in getting Organization ${organizationId} details`),
    );
    return;
  }
  if (!organization?.data) {
    spinner.fail(
      chalk.red(`Organization ${organizationId} not found`),
    );
    return;
  }

  const action = await askMirgrationInformation();

  // Get data as json from csv
  const mappingData = await getJsonFromCSV(mappingCsv as string);

  const mappedEmails = csvFileDataValidation(mappingData);

  const existingEmails = mappedEmails.map((data) => data.existingEmail);

  let orgOwner;
  spinner.start(`Validating Owner email existence in the Mapping CSV`);

  const getOrgOwner = await organizationService.getOrganizationOwner(organizationId, [
    'id',
    'email',
  ]);
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

  spinner.start(`Started the ${action} in ${organizationId}`);
  const startTime = performance.now();

  // Get All Members list from the given OrganizationId
  const orgMembers = await getOrganizationMembers(organizationId);
  const organizationMembers = [];

  orgMembers.forEach((result) => {
      organizationMembers.push({
        id: result.member.id,
        email: result.member.email,
        role: {
          id: result.organizationRole.id,
          type: result.organizationRole.type,
        },
      });
    });

};
