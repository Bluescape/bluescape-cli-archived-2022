import { FetchRequestType, Service } from '../types';
import { FetchService } from './fetch.service';

export class OrganizationService extends FetchService {
  constructor() {
    super();
  }

  async getOrganizationById(
    orgnaizationId: string
  ): Promise<any> {
    const attributes = ['id', 'canHaveGuests', 'isGuestInviteApprovalRequired', 'defaultOrganizationUserRole { id type }'];
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
}
