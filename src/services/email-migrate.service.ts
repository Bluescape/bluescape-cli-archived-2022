import chalk from 'chalk';
import { organizationService } from '.';
import { Email } from '../types';
import { valueExists } from '../utils/validators';
import { FetchService } from './fetch.service';

export interface MappedEmailInformation {
  existing: Email;
  sso?: Email;
  workspaceOwner?: Email;
}

 const toFindDuplicateElements = (ele: string[], strict = false) => {
  return ele.filter((item, index) => {
    if (strict) {
      if (item.length > 0) ele.indexOf(item) !== index;
    }
    ele.indexOf(item) !== index;
  });
};

export const csvFileDataValidation = (
  mappingData: Array<Record<string, string>>,
): MappedEmailInformation[] => {
  // Finding duplicates in user emails array
  const mappedEmails: any[] = [];
  mappingData.forEach((email) => {
    mappedEmails.push({
      existing: email['Existing Email'],
      sso: email['SSO Email'],
      workspaceOwner: email['Workspace Owner Email'],
    });
  });

  console.log('\n\n Mapped Emails -->', mappedEmails);
  const existingEmails = mappedEmails.map((data) => data.existing);
  const ssoEmails = mappedEmails.map((data) => data.sso);

  console.log('\n\n existingEmails -->', existingEmails);
  console.log('\n\n ssoEmails -->', ssoEmails);
  if (existingEmails.length === 0 || ssoEmails.length === 0) {
    throw new Error(
      `CSV file is empty. Please provide atleast one user existing email address and sso email address to migrate.`,
    );
  }

  // Find out existing email duplicates
  const duplicateExistingEmails = toFindDuplicateElements(existingEmails);
  console.log('\n\n dupli ==>', duplicateExistingEmails);
  if (duplicateExistingEmails.length > 0) {
    throw new Error(
      `CSV file contains the duplicate existing email(s) - ${duplicateExistingEmails.concat(
        '\n',
      )}`,
    );
  }

  // Find out sso email duplicates
  const duplicateSsoEmails = toFindDuplicateElements(ssoEmails);
  console.log('\n\n empty line ==', duplicateSsoEmails);
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

  // if (getOrgMembers.error) {
  //   spinner.fail(
  //     chalk.red(`Error in getting Organization ${organizationId} Members`),
  //   );
  //   return;
  // }
  const orgMembers =
    (getOrgMembers.data as any)?.organization?.members?.results || [];
  const nextCursor = getOrgMembers.data?.organization?.members?.next;

  if (orgMembers && orgMembers.length > 0) {
    if (valueExists(nextCursor)) {
      return orgMembers.concat(
        await getOrganizationMembers(organizationId, nextCursor),
      );
    } else {
      return orgMembers;
    }
  }
};

export class EmailMigrationService extends FetchService {
  constructor() {
    super();
  }


  // async updateEmail(
  //   sourceMemberEmail,
  //   targetMemberEmail,
  // ): Promise<any> {
  //   if(!sourceMemberBelongsToManyOrgs && !targetMember.id) {
  //     // If the ExistingMember doesn't belong to many organization, and the SSO Email is not already present
  //     // Update the Email address to SSO domain
  //     const updateUserEmail = await userService.updateUserEmail(sourceMember.id, targetMember.email, ['id', 'email'])
  //     if (updateUserEmail.error) {
  //       spinner.fail(
  //         chalk.red(
  //           `${progressing} - Failed to update user email ${updateUserEmail.error} \n`,
  //         ),
  //       );
  //       continue;
  //     }
  //   }
  // }


  
}
