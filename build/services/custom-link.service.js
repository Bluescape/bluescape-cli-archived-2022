"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomLinkService = void 0;
const types_1 = require("../types");
const fetch_service_1 = require("./fetch.service");
class CustomLinkService extends fetch_service_1.FetchService {
    constructor() {
        super();
    }
    async getCustomLinkAvailability(name, attributes) {
        const query = `query{customLinkAvailability(input:{name:"${name}"}) {${attributes.concat('\n')}}}`;
        const url = this.getUrlForService(types_1.Service.ISAM_GRAPHQL);
        const result = await this.request(types_1.FetchRequestType.Post, url, { query });
        return result?.data;
    }
    async customLinks(ownerId, attributes) {
        const query = `query{customLinks(filtering: { ownerId: { eq: "${ownerId}" } }) {results { ${attributes.concat('\n')}}}}`;
        const url = this.getUrlForService(types_1.Service.ISAM_GRAPHQL);
        const result = await this.request(types_1.FetchRequestType.Post, url, { query });
        return result?.data;
    }
    async createCustomLink(props, attributes) {
        const { name, ownerId, resourceType, resourceId } = props;
        let query = `mutation{createCustomLink(input:{name:"${name}", `;
        if (resourceId) {
            query += `resourceId:"${resourceId}", `;
        }
        if (ownerId) {
            query += `ownerId:"${ownerId}", `;
        }
        query += `resourceType: ${resourceType}}) {${attributes.concat('\n')}}}`;
        const url = this.getUrlForService(types_1.Service.ISAM_GRAPHQL);
        const result = await this.request(types_1.FetchRequestType.Post, url, { query });
        return result?.data;
    }
    async updateCustomLink(props, attributes) {
        const { name, id } = props;
        const query = `mutation{updateCustomLink(input:{name:"${name}"}  customLinkId: "${id}") {${attributes.concat('\n')}}}`;
        const url = this.getUrlForService(types_1.Service.ISAM_GRAPHQL);
        const result = await this.request(types_1.FetchRequestType.Post, url, { query });
        return result?.data;
    }
    async createMeeting(name, ownerId) {
        try {
            const path = `chime/meetings/host`;
            const url = this.getUrlForService(types_1.Service.UC_CONNECTOR_URL, path);
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
            const response = await this.request(types_1.FetchRequestType.Post, url, {
                ...payload,
            });
            return response?.data?.meetingId;
        }
        catch (error) {
            console.warn(`createMeeting failed with this messages ${error?.message}`);
            throw error;
        }
    }
}
exports.CustomLinkService = CustomLinkService;
//# sourceMappingURL=custom-link.service.js.map