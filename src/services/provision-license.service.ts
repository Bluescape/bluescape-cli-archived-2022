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
    const query = `mutation{ linkExternalLegacySubscription(
      organizationId:"${organizationId}", 
      input: { externalSubscriptionId: "${
        legacySubscriptionInput.externalSubscriptionId
      }", externalSubscriptionVersion: ${
      legacySubscriptionInput.externalSubscriptionVersion
    }, licenseQuantity: ${legacySubscriptionInput.licenseQuantity}, currency: ${
      legacySubscriptionInput.currency
    }, interval: ${
      legacySubscriptionInput.interval
    }, organizationStorageLimitMb: ${
      legacySubscriptionInput.organizationStorageLimitMb
    }}) {
          ${attributes.concat('\n')}
      }
    }`;

    const url = this.getUrlForService(Service.ISAM_GRAPHQL);
    const { data } = await this.request(FetchRequestType.Post, url, { query });
    return data;
  }
}
