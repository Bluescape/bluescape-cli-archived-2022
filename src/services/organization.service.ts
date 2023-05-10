import { Roles } from '../commands/user/role.types';
import { FetchRequestType, Service } from '../types';
import { FetchService } from './fetch.service';
export type UpdateOrganizationProps = {
  autoAssociateIdentityProviderUser?: boolean;
};
export class OrganizationService extends FetchService {
  constructor() {
    super();
  }

  async getAllOrganizations(
    pageSize?: number,
    cursor?: string,
    includeTotalCount = false,
  ): Promise<any> {
    let query = `{organizations(pagination:{pageSize: ${pageSize}}`;
    if (cursor) {
      query += `, cursor: "${cursor}"`;
    }
    query += `){results{id name autoAssociateIdentityProviderUser accountId identityProvider { id }} next`;
    if (includeTotalCount) {
      query += ` totalItems`;
    }
    query += `}}`;
    const url = this.getUrlForService(Service.ISAM_GRAPHQL);
    const { data } = await this.request(FetchRequestType.Post, url, {
      query,
    });
    return data;
  }

  async getOrganizationById(orgnaizationId: string): Promise<any> {
    const attributes = [
      'id',
      'canHaveGuests',
      'isGuestInviteApprovalRequired',
      'defaultOrganizationUserRole { id type }',
      'identityProvider { id }',
      'accountId'
    ];
    const query = `{organization(organizationId:"${orgnaizationId}"){${attributes.concat(
      '\n',
    )}}}`;
    const url = this.getUrlForService(Service.ISAM_GRAPHQL);
    const { data } = await this.request(FetchRequestType.Post, url, { query });
    return data;
  }

  async getOrganizationOwner(
    orgnaizationId: string,
    attributes: string[],
  ): Promise<any> {
    const query = `{organization(organizationId:"${orgnaizationId}"){members(filtering: { organizationRole: { type: {eq: "owner"}} }){
      results {
        member {
          __typename 
          ... on User {
            ${attributes.concat('\n')}
          }
        }
      }
    }}}`;
    const url = this.getUrlForService(Service.ISAM_GRAPHQL);
    const { data } = await this.request(FetchRequestType.Post, url, { query });
    return data;
  }

  async getOrganizationMemberByEmail(
    orgnaizationId: string,
    userEmail: string,
    userAttributes: string[],
    roleAttributes: string[],
  ): Promise<any> {
    const query = `{organization(organizationId:"${orgnaizationId}"){
      members(filtering: { user : { email : { eq: "${userEmail}"}}}) {
        results {
          member {
            __typename 
            ... on User {
              ${userAttributes.concat('\n')}
            }
          }
          organizationRole {
            ${roleAttributes.concat('\n')}
          }
        }
      }
    }}`;
    const url = this.getUrlForService(Service.ISAM_GRAPHQL);
    const { data } = await this.request(FetchRequestType.Post, url, { query });
    return data;
  }

  async addMemberToOrganization(
    orgnaizationId: string,
    userId: string,
    organizationRoleId: string,
    userAttributes: string[],
    roleAttributes: string[],
  ): Promise<any> {
    const query = `mutation{addMember(
      organizationId:"${orgnaizationId}", 
      input: { organizationRoleId: "${organizationRoleId}" , id: "${userId}"}) {
        licenseLevel
        organizationRole {
          ${roleAttributes.concat('\n')}
        }
        member {
          __typename 
          ... on User {
            ${userAttributes.concat('\n')}
          }
        }
      }
    }`;

    const url = this.getUrlForService(Service.ISAM_GRAPHQL);
    const { data } = await this.request(FetchRequestType.Post, url, { query });
    return data;
  }

  async requestToTransferMemberResourcesInOrganization(
    organizationId: string,
    sourceMemberId: string,
    targetMemberId: string,
  ): Promise<any> {
    const query = `mutation{requestTransferMemberResources(
      organizationId:"${organizationId}", 
      sourceMemberId:"${sourceMemberId}", 
      targetMemberId:"${targetMemberId}", 
      input: { includeWorkspacesOwned: true , includeWorkspacesShared: true, includeTemplatesOwned: true})
    }`;

    const url = this.getUrlForService(Service.ISAM_GRAPHQL);
    const { data } = await this.request(FetchRequestType.Post, url, { query });
    return data;
  }

  async updateOrganizationMemberRole(
    memberId: string,
    orgnaizationId: string,
    organizationRoleId: string,
    newWorkspaceOwnerId?: string,
  ): Promise<any> {
    let path;
    path = `/organizations/${orgnaizationId}/members/${memberId}/role`;
    if (newWorkspaceOwnerId) {
      path = `/organizations/${orgnaizationId}/members/${memberId}/role?newWorkspaceOwnerId=${newWorkspaceOwnerId}`;
    }

    const url = this.getUrlForService(Service.ISAM, path);
    const payload = {
      organizationRoleId,
    };

    let data;
    try {
      data = await this.request(FetchRequestType.Patch, url, {
        ...payload,
      });
      return data;
    } catch (error) {
      return { error };
    }
  }

  async getOrganizationRoleByType(
    orgnaizationId: string,
    attributes: string[],
    type: Roles,
  ): Promise<any> {
    const query = `{roles(
      filtering: {
        and: [
          { organizationId: { eq: "${orgnaizationId}" } }
          { resourceType: { eq: Organization } }
          { type: { eq: ${type} } }
          { level: { eq: Primary } }
          { isCustom: { eq: false } }
        ]
      }){
      results {
        ${attributes.concat('\n')}
      }
    }}`;
    const url = this.getUrlForService(Service.ISAM_GRAPHQL);
    const { data } = await this.request(FetchRequestType.Post, url, { query });
    return data;
  }

  async updateOrganizationAutoAssociateIDPUser(
    organizationId: string,
    props: boolean,
  ): Promise<any> {
    const query = `mutation{updateOrganization(
      organizationId:"${organizationId}", 
      input:{autoAssociateIdentityProviderUser: ${props}}
    ){id}}`;
    const url = this.getUrlForService(Service.ISAM_GRAPHQL);
    const { data } = await this.request(FetchRequestType.Post, url, { query });
    return data;
  }

  async addOrganizationToAccount(
    organizationId: string,
    accountId: string,
  ): Promise<any> {
    const path = `/organizations/${organizationId}/accounts`;

    const url = this.getUrlForService(Service.ISAM, path);
    const payload = {
      accountId,
    };
    try {
      const data = await this.request(FetchRequestType.Patch, url, {
        ...payload,
      });
      return data;
    } catch (error) {
      return { error };
    }
  }

  async getOrganizationIdp(
    identityProviderId: string,
  ): Promise<any> {
    const path = `/identityProviders/${identityProviderId}`;

    const url = this.getUrlForService(Service.ISAM, path);
    const payload = {
      identityProviderId,
    };
    try {
      const data = await this.request(FetchRequestType.Get, url, {
        ...payload,
      });
      return data;
    } catch (error) {
      return { error };
    }
  }
}
