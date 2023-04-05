import validator from 'validator';
import { Roles } from '../commands/user/role.types';
import { Email } from '../types';
import { valueExists } from '../utils/validators';
import { FetchService } from './fetch.service';
import { organizationService, userService } from './index';

const userAttributes = ['id', 'email'];
const roleAttributes = ['id', 'type'];

export interface MappedEmailInformation {
  existing: Email;
  sso?: Email;
  workspaceOwner?: Email;
}

const toFindDuplicateElements = (ele: string[]) =>
  ele.filter((item, index) => ele.indexOf(item) !== index && item.length > 0);

export const csvFileDataValidation = (
  mappingData: Array<Record<string, string>>,
): MappedEmailInformation[] => {
  // Finding duplicates in user emails array
  const mappedEmails: any[] = [];

  if (mappingData.length === 0) {
    throw new Error(
      `CSV file is empty. Please provide atleast one user existing email address to migrate.`,
    );
  }
  if (
    !mappingData[0].hasOwnProperty('Existing Email') ||
    !mappingData[0].hasOwnProperty('SSO Email') ||
    !mappingData[0].hasOwnProperty('Workspace Reassignment Email')
  ) {
    throw new Error(
      `CSV file should have expected column headers - Existing Email, SSO Email, Workspace Reassignment Email.`,
    );
  }
  mappingData.forEach((email) => {
    // Change the case insensitive
    mappedEmails.push({
      existing: email['Existing Email'].toLowerCase(),
      sso: email['SSO Email'].toLowerCase(),
      workspaceOwner: email['Workspace Reassignment Email'].toLowerCase(),
    });
  });

  const allEmails = [];
  mappedEmails.map((email) => {
    allEmails.push(email.existing);
    allEmails.push(email.sso);
  });

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
  return true;
};

export class EmailMigrationService extends FetchService {
  constructor() {
    super();
  }

  async checkIfUserBelongsToManyOrganizations(userId: string): Promise<any> {
    const { data, error } =
      await userService.getUserOrganizationsExcludingPersonalSpace(userId, 100);

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

  async getOrganizationOwner(organizationId: string): Promise<any> {
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
      return orgOwnerEmail;
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

  async getOrganizationRoleByType(
    organizationId: string,
    type: Roles,
  ): Promise<any> {
    const { data, errors: existenceError } =
      await organizationService.getOrganizationRoleByType(
        organizationId,
        roleAttributes,
        type,
      );

    if (existenceError) {
      const [{ message }] = existenceError as any;
      return { error: message };
    }

    const visitorRole = (data as any)?.roles?.results || [];

    if (visitorRole.length > 0) {
      return visitorRole[0].id;
    }
    return null;
  }

  async requestToTransferMemberResourcesInOrganization(
    organizationId: string,
    sourceMemberId: string,
    targetMemberId: string,
  ): Promise<any> {
    const { data, errors: existenceError } =
      await organizationService.requestToTransferMemberResourcesInOrganization(
        organizationId,
        sourceMemberId,
        targetMemberId,
      );

    if (existenceError) {
      const [{ message, extensions }] = existenceError as any;
      const error = {
        message,
        statusCode: extensions.statusCode,
      };
      return { error };
    }
    const requestSent = (data as any)?.requestTransferMemberResources || false;

    if (valueExists(requestSent)) {
      return true;
    }
    return false;
  }

  async updateUserEmail(userId: string, email: string): Promise<any> {
    const { data, errors: updateEmailError } =
      await userService.updateUserEmail(userId, email, userAttributes);

    if (updateEmailError) {
      const [{ message }] = updateEmailError as any;
      return { error: message };
    }
    return data;
  }

  /**
   *
   * @param organizationId
   * @param ssoEmail
   * @param targetMemberId
   * @returns targetMemberId - if it can be the newly created, or the existing one
   */
  async splitOrMergeAccount(
    organizationId: string,
    ssoEmail: string,
    targetMemberId?: string,
  ): Promise<any> {
    let targetMember;
    let isOrgMember = false;
    if (!valueExists(targetMemberId)) {
      const { data, errors: existenceError } =
        await userService.createUserWithoutOrganization(ssoEmail);

      if (existenceError) {
        const [{ message, extensions }] = existenceError as any;
        const error = {
          message,
          statusCode: extensions.statusCode,
        };
        return { error };
      }
      targetMember = data || false;
    } else {
      // The SSO Email already present
      // If the SSO Member doesn't belong to many organization
      // Check if the target user belongs to this organization already
      const getTargetOrgMember = await this.getOrganizationMemberByEmail(
        organizationId,
        ssoEmail,
      );
      if (getTargetOrgMember && getTargetOrgMember?.error) {
        return { error: getTargetOrgMember?.error };
      }
      if (getTargetOrgMember) {
        isOrgMember = true;
      }
    }
    // If the ssoEmail user exists, and not a member of the organization, add him to the org.
    if (!isOrgMember) {
      // targetOrgMember = getTargetOrgMember;
      // Get Member Role Id
      const memberRole = await this.getOrganizationRoleByType(
        organizationId,
        Roles.User,
      );
      if (memberRole?.error) {
        return { error: memberRole?.error };
      }
      const addOrgMember = await this.addMemberToOrganization(
        organizationId,
        valueExists(targetMember?.id) ? targetMember.id : targetMemberId,
        memberRole,
      );

      if (addOrgMember && addOrgMember?.error) {
        return { error: addOrgMember?.error };
      }
    }
    return valueExists(targetMember?.id) ? targetMember.id : targetMemberId;
  }
}
