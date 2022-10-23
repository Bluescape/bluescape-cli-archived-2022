import validator from 'validator';
import { organizationService, userService } from './index';
import { Roles } from '../commands/user/role.types';
import { Email } from '../types';
import { valueExists } from '../utils/validators';
import { FetchService } from './fetch.service';

export interface MappedEmailInformation {
  existing: Email;
  sso?: Email;
  workspaceOwner?: Email;
}

const toFindDuplicateElements = (ele: string[]) =>
  ele.filter((item, index) => (ele.indexOf(item) !== index) && item.length>0);

export const csvFileDataValidation = (
  mappingData: Array<Record<string, string>>,
): MappedEmailInformation[] => {
  // Finding duplicates in user emails array
  const mappedEmails: any[] = [];
  mappingData.forEach((email) => {

    // Change the case insensitive
    mappedEmails.push({
      existing: email['Existing Email'].toLowerCase(),
      sso: email['SSO Email'].toLowerCase(),
      workspaceOwner: email['Workspace Owner Email'].toLowerCase(),
    });
  });

  const allEmails = [];
  mappedEmails.map(email => {
    allEmails.push(email.existing);
    allEmails.push(email.sso);
  });

  if (allEmails.length === 0) {
    throw new Error(
      `CSV file is empty. Please provide atleast one user existing email address to migrate.`,
    );
  }

  // Find out existing email duplicates
  const duplicateEmails = toFindDuplicateElements(allEmails);
  if (duplicateEmails.length > 0) {
    throw new Error(
      `CSV file contains the duplicate email(s) - ${duplicateEmails.concat(
        '\n',
      )}`,
    );
  }
  return mappedEmails;
};

export const validateEmail = (email: string): any => {
  if (!validator.isEmail(email)) {
    const message = `Invalid email format `;
    return { error: message };
  }
};

export class EmailMigrationService extends FetchService {
  constructor() {
    super();
  }

  async checkIfUserBelongsToManyOrganizations(userId: string): Promise<any> {
    const {
      data,
      error,
    } = await userService.getUserOrganizations(userId, 100);
    
    if (error) {
      return { error: `Failed to fetch user organizations ${error}` };
    }
    if (data?.organizations && data?.organizations.length > 1) {
      return true;
    }
    return false;
  }

  async validateSessionUserRole(
    userEmail: string,
    roleType: Roles,
  ): Promise<any> {
    const { data, errors: userExistenceError } =
      await userService.getUserFromEmail(userEmail, [
        'id',
        'applicationRole{type}',
      ]);
    if (userExistenceError) {
      const [{ message }] = userExistenceError as any;
      return { error: message };
    }
    const sessionUser = (data as any)?.user || {};
    // Do Not Allow to perform this Action other than Instance Admin
    if (sessionUser?.applicationRole?.type !== roleType) {
      return false;
    }
    return true;
  }

  async validateOrganizationOwnerExistence(
    organizationId: string,
    existingEmails: string[],
  ): Promise<any> {
    const { data, errors: ownerExistenceError } =
      await organizationService.getOrganizationOwner(organizationId, [
        'id',
        'email',
      ]);
    if (ownerExistenceError) {
      const [{ message }] = ownerExistenceError as any;
      return { error: message };
    }
    const orgOwner = (data as any)?.organization || {};

    if (orgOwner?.members?.results && orgOwner?.members?.results.length > 0) {
      const orgOwnerEmail = orgOwner.members.results[0].member.email;
       // If the owner email is not provided for migration, throw error and Do Not Proceed further
     return existingEmails.includes(orgOwnerEmail);
    }
    return false;
  }
}
