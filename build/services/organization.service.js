"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationService = void 0;
const types_1 = require("../types");
const fetch_service_1 = require("./fetch.service");
class OrganizationService extends fetch_service_1.FetchService {
    constructor() {
        super();
    }
    async getOrganizationById(orgnaizationId) {
        const attributes = ['id', 'canHaveGuests', 'isGuestInviteApprovalRequired', 'defaultOrganizationUserRole { id type }'];
        const query = `{organization(organizationId:"${orgnaizationId}"){${attributes.concat('\n')}}}`;
        const url = this.getUrlForService(types_1.Service.ISAM_GRAPHQL);
        const { data } = await this.request(types_1.FetchRequestType.Post, url, { query });
        return data;
    }
    async getOrganizationOwner(orgnaizationId, attributes) {
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
        const url = this.getUrlForService(types_1.Service.ISAM_GRAPHQL);
        const { data } = await this.request(types_1.FetchRequestType.Post, url, { query });
        return data;
    }
    async getOrganizationMemberByEmail(orgnaizationId, userEmail, userAttributes, roleAttributes) {
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
        const url = this.getUrlForService(types_1.Service.ISAM_GRAPHQL);
        const { data } = await this.request(types_1.FetchRequestType.Post, url, { query });
        return data;
    }
    async addMemberToOrganization(orgnaizationId, userId, organizationRoleId, userAttributes, roleAttributes) {
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
        const url = this.getUrlForService(types_1.Service.ISAM_GRAPHQL);
        const { data } = await this.request(types_1.FetchRequestType.Post, url, { query });
        return data;
    }
    async updateOrganizationMemberRole(memberId, orgnaizationId, organizationRoleId, newWorkspaceOwnerId) {
        let path;
        path = `/organizations/${orgnaizationId}/members/${memberId}/role`;
        if (newWorkspaceOwnerId) {
            path = `/organizations/${orgnaizationId}/members/${memberId}/role?newWorkspaceOwnerId=${newWorkspaceOwnerId}`;
        }
        const url = this.getUrlForService(types_1.Service.ISAM, path);
        const payload = {
            organizationRoleId
        };
        let data;
        try {
            data = await this.request(types_1.FetchRequestType.Patch, url, {
                ...payload,
            });
            return data;
        }
        catch (error) {
            return { error };
        }
    }
    async getOrganizationVisitorRole(orgnaizationId, attributes) {
        const query = `{roles(
      filtering: {
        and: [
          { organizationId: { eq: "${orgnaizationId}" } }
          { resourceType: { eq: Organization } }
          { type: { eq: Visitor } }
          { level: { eq: Primary } }
          { isCustom: { eq: false } }
        ]
      }){
      results {
        ${attributes.concat('\n')}
      }
    }}`;
        const url = this.getUrlForService(types_1.Service.ISAM_GRAPHQL);
        const { data } = await this.request(types_1.FetchRequestType.Post, url, { query });
        return data;
    }
}
exports.OrganizationService = OrganizationService;
//# sourceMappingURL=organization.service.js.map