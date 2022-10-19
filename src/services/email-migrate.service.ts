import validator from 'validator';
import { organizationService, userService } from '.';
import { ApplicationRole } from '../commands/user/role.types';
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

  const existingEmails = mappedEmails.map((data) => data.existing);
  const ssoEmails = mappedEmails.map((data) => data.sso);

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

export const validateEmail = (email: string): any => {
  if (!validator.isEmail(email)) {
    const message = `Invalid email format `;
    return { error: message };
  }
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

  async validateSessionUserUserRole(
    userEmail: string,
    roleType: ApplicationRole,
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

    let orgOwnerEmail;
    if (orgOwner?.members?.results && orgOwner?.members?.results.length > 0) {
      orgOwnerEmail = orgOwner.members.results[0].member.email;
    }
    // If the owner email is not provided for migration, throw error and Do Not Proceed further
    if (!orgOwnerEmail || !existingEmails.includes(orgOwnerEmail)) {
      return false;
    }
    return true;
  }

  async validateOrganizationExistence(
    userEmail: string,
    roleType: ApplicationRole,
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
}
