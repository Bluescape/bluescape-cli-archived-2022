import validator from 'validator';
import { organizationService, userService } from './index';
import { Roles } from '../commands/user/role.types';
import { Email } from '../types';
import { valueExists } from '../utils/validators';
import { FetchService } from './fetch.service';

const userAttributes = ['id', 'email'];
const roleAttributes = ['id', 'type'];

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
      workspaceOwner: email['Workspace Reassignment Email'].toLowerCase(),
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
    const { data, error } = await userService.getUserOrganizations(userId, 100);

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

  async getOrganizationMemberByEmail(
    organizationId: string,
    email: string,
  ): Promise<any> {
    const userAttributes = ['id', 'email'];
    const roleAttributes = ['id', 'type'];
    const { data, errors: memberExistenceError } =
      await organizationService.getOrganizationMemberByEmail(
        organizationId,
        email,
        userAttributes,
        roleAttributes,
      );

    if (memberExistenceError) {
      const [{ message }] = memberExistenceError as any;
      return { error: message };
    }
    const orgMember = (data as any)?.organization?.members?.results || [];

    let member;

    if (orgMember.length > 0) {
      member = {
        id: orgMember[0].member.id,
        email: orgMember[0].member.email,
        role: {
          id: orgMember[0].organizationRole.id,
          type: orgMember[0].organizationRole.type,
        },
      };
    }
    return member;
  }

  async addMemberToOrganization(
    organizationId: string,
    userId: string,
    organizationRoleId: string,
  ): Promise<any> {
    const { data, errors: existenceError } =
      await organizationService.addMemberToOrganization(
        organizationId,
        userId,
        organizationRoleId,
        userAttributes,
        roleAttributes,
      );

    if (existenceError) {
      const [{ message }] = existenceError as any;
      return { error: message };
    }
    const orgMember = (data as any)?.addMember || {};

    let member;

    if (valueExists(orgMember)) {
      const {
        member: { id, email },
        organizationRole: { id: orgRoleId, type },
      } = orgMember;
      member = {
        id,
        email,
        role: {
          id: orgRoleId,
          type,
        },
      };
    }
    return member;
  }

  async getOrganizationVisitorRoleId(
    organizationId: string
  ): Promise<any> {
    const { data, errors: existenceError } =
      await organizationService.getOrganizationVisitorRole(
        organizationId,
        roleAttributes,
      );

    if (existenceError) {
      const [{ message }] = existenceError as any;
      return { error: message };
    }

    const visitorRole = (data as any)?.roles?.results || [];

    if (visitorRole.length > 0) {
      return visitorRole[0].id
    }
    return null;
  }
}
