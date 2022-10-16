import { FetchRequestType, Service } from '../types';
import { FetchService } from './fetch.service';

export class OrganizationService extends FetchService {
  constructor() {
    super();
  }

  async getOrganizationById(orgnaizationId: string, attributes: string[]): Promise<any> {
    const query = `{organization(organizationId:"${orgnaizationId}"){${attributes.concat('\n')}}}`;
    const url = this.getUrlForService(Service.ISAM_GRAPHQL);
    const { data } = await this.request(FetchRequestType.Post, url, { query });
    return data;
  }

  async getOrganizationOwner(orgnaizationId: string, attributes: string[]): Promise<any> {
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

  async getOrganizationMembers(orgnaizationId: string, userAttributes: string[], roleAttributes: string[], pageSize: number, cursor?: string): Promise<any> {
    let options: any = `pagination: { pageSize: ${pageSize} } `;
    if (cursor) {
      options = `pagination: { pageSize: ${pageSize} }, cursor: "${cursor}"`;
    }
    const query = `{organization(organizationId:"${orgnaizationId}"){
      members(${options}) {
        totalItems
        prev
        next
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
}
