import { CreateCustomLinkProps } from '../commands/customlink/custom-link.types';
import { FetchRequestType, Service } from '../types';
import { FetchService } from './fetch.service';

export class CustomLinkService extends FetchService {
  constructor() {
    super();
  }

  async getCustomLinkAvailability(
    name: string,
    attributes: string[],
  ): Promise<any> {
    const query = `query{customLinkAvailability(input:{name:"${name}"}) {${attributes.concat(
      '\n',
    )}}}`;
    const url = this.getUrlForService(Service.ISAM_GRAPHQL);
    const result = await this.request(FetchRequestType.Post, url, { query });
    return result?.data as any;
  }

  async customLinks(ownerId: string, attributes: string[]): Promise<any> {
    const query = `query{customLinks(filtering: { ownerId: { eq: "${ownerId}" } }) {results { ${attributes.concat(
      '\n',
    )}}}}`;
    const url = this.getUrlForService(Service.ISAM_GRAPHQL);
    const result = await this.request(FetchRequestType.Post, url, { query });
    return result?.data as any;
  }

  async createCustomLink(
    props: CreateCustomLinkProps,
    attributes: string[],
  ): Promise<any> {
    const { name, ownerId, resourceType, resourceId } = props;
    let query = `mutation{createCustomLink(input:{name:"${name}", `;
    if (resourceId) {
      query += `resourceId:"${resourceId}", `;
    }
    query += `resourceType: ${resourceType}, ownerId: "${ownerId}"}) {${attributes.concat(
      '\n',
    )}}}`;
    const url = this.getUrlForService(Service.ISAM_GRAPHQL);
    const result = await this.request(FetchRequestType.Post, url, { query });
    return result?.data as any;
  }

  async updateCustomLink(
    props: Record<string, unknown>,
    attributes: string[],
  ): Promise<any> {
    const { name, id } = props;
    const query = `mutation{updateCustomLink(input:{name:"${name}"}  customLinkId: "${id}") {${attributes.concat(
      '\n',
    )}}}`;
    const url = this.getUrlForService(Service.ISAM_GRAPHQL);
    const result = await this.request(FetchRequestType.Post, url, { query });
    return result?.data as any;
  }

  /**
   * @param name
   * @param ownerId
   * @return meeting id
   */
  async createMeeting(name: string, ownerId: string): Promise<string> {
    try {
      const path = `chime/meetings/host`;
      const url = this.getUrlForService(Service.UC_CONNECTOR_URL, path);
      const payload = {
        name,
        recurrence: {
          type: 'non_recurring',
        },
        attendees: [],
        providerSpecificOptions: {
          meetingType: 'personal-room',
          telephonySupport: true,
        },
        organizerId: ownerId,
      };

      console.log('url*****************', url);

      const response = await this.request(FetchRequestType.Post, url, {
        ...payload,
      });

      return response?.data?.meetingId as string;
    } catch (error) {
      console.warn(`createMeeting failed with this messages ${error?.message}`);
      // throw error;
    }
  }
}
