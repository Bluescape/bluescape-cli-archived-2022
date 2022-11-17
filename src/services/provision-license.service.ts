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
<<<<<<< HEAD
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
=======
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
>>>>>>> f60539db34f134fe870e3bfebfa60be195761e68
          ${attributes.concat('\n')}
      }
    }`;

    const url = this.getUrlForService(Service.ISAM_GRAPHQL);
    const { data } = await this.request(FetchRequestType.Post, url, { query });
    return data;
  }
}
