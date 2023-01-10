"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvisionLicenseService = void 0;
const types_1 = require("../types");
const fetch_service_1 = require("./fetch.service");
class ProvisionLicenseService extends fetch_service_1.FetchService {
    constructor() {
        super();
    }
    async linkExternalLegacySubscription(organizationId, legacySubscriptionInput, attributes) {
        const { externalSubscriptionId, externalSubscriptionVersion, licenseQuantity, currency, interval, organizationStorageLimitMb, } = legacySubscriptionInput;
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
        const url = this.getUrlForService(types_1.Service.ISAM_GRAPHQL);
        const { data } = await this.request(types_1.FetchRequestType.Post, url, { query });
        return data;
    }
}
exports.ProvisionLicenseService = ProvisionLicenseService;
//# sourceMappingURL=provision-license.service.js.map