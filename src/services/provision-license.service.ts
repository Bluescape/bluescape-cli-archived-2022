import { FetchRequestType, Service } from '../types';
import { FetchService } from './fetch.service';

export class ProvisionLicenseService extends FetchService {
  constructor() {
    super();
  }

  async linkExternalLegacySubscription(
    organizationId: string,
    legacySubscriptionInput: any,
    attributes: string[],
  ): Promise<any> {
    const {
      externalSubscriptionId,
      externalSubscriptionVersion,
      licenseQuantity,
      currency,
      interval,
      organizationStorageLimitMb,
    } = legacySubscriptionInput;
    let mutationInput = `externalSubscriptionId: "${externalSubscriptionId}", 
    externalSubscriptionVersion: ${externalSubscriptionVersion}, 
    currency: ${currency}, 
    interval: ${interval}, `;
    if (licenseQuantity) {
      mutationInput += `licenseQuantity: ${licenseQuantity}, `;
    }
    if (organizationStorageLimitMb) {
      mutationInput += `organizationStorageLimitMb: ${organizationStorageLimitMb}, `;
    }
    const query = `mutation{ linkExternalLegacySubscription(
      organizationId:"${organizationId}", 
      input: { ${mutationInput} }) {
          ${attributes.concat('\n')}
      }
    }`;

    const url = this.getUrlForService(Service.ISAM_GRAPHQL);
    const { data } = await this.request(FetchRequestType.Post, url, { query });
    return data;
  }
}
