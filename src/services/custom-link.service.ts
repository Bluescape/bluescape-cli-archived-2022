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
    const query = `query{customLinkAvailability(input:{name:"${name}"}) {${attributes.concat('\n')}}}`;
    const url = this.getUrlForService(Service.ISAM_GRAPQL);
    const result = await this.request(FetchRequestType.Post, url, { query });
    return result?.data as any;
  }

  async customLinks(
    ownerId: string,
    attributes: string[],
  ): Promise<any> {
    const query = `query{customLinks(filtering: { ownerId: { eq: "${ownerId}" } }) {results { ${attributes.concat('\n')}}}}`;
    const url = this.getUrlForService(Service.ISAM_GRAPQL);
    const result = await this.request(FetchRequestType.Post, url, { query });
    return result?.data as any;
  }

  async createCustomLink(props: CreateCustomLinkProps, attributes: string[]): Promise<any> {
    const { name, ownerId } = props;
    const resourceId = 'a11PrwXLGFxYRVG4tGdd'; // This is optional
    const query = `mutation{createCustomLink(input:{name:"${name}", resourceType: Blocked, ownerId: "${ownerId}", resourceId:"${resourceId}"}) {${attributes.concat('\n')}}}`;
    const url = this.getUrlForService(Service.ISAM_GRAPQL);
    const result = await this.request(FetchRequestType.Post, url, { query });
    return result?.data as any;
  }

  async updateCustomLink(props: Record<string, unknown>, attributes: string[]): Promise<any> {
    const { name, id } = props;
    const query = `mutation{updateCustomLink(input:{name:"${name}", resourceType: Blocked}  customLinkId: "${id}") {${attributes.concat('\n')}}}`;
    const url = this.getUrlForService(Service.ISAM_GRAPQL);
    const result = await this.request(FetchRequestType.Post, url, { query });
    return result?.data as any;
  }
}