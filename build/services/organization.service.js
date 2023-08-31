"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationService = void 0;
const types_1 = require("../types");
const fetch_service_1 = require("./fetch.service");
class OrganizationService extends fetch_service_1.FetchService {
    constructor() {
        super();
    }
    async getAllOrganizations(pageSize, cursor, includeTotalCount = false) {
        let query = `{organizations(pagination:{pageSize: ${pageSize}}`;
        if (cursor) {
            query += `, cursor: "${cursor}"`;
        }
        query += `){results{id name autoAssociateIdentityProviderUser accountId identityProvider { id }} next`;
        if (includeTotalCount) {
            query += ` totalItems`;
        }
        query += `}}`;
        const url = this.getUrlForService(types_1.Service.ISAM_GRAPHQL);
        const { data } = await this.request(types_1.FetchRequestType.Post, url, {
            query,
        });
        return data;
    }
    async getOrganizationById(orgnaizationId) {
        const attributes = [
            'id',
            'canHaveGuests',
            'isGuestInviteApprovalRequired',
            'defaultOrganizationUserRole { id type }',
            'identityProvider { id }',
            'accountId'
        ];
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
    async requestToTransferMemberResourcesInOrganization(organizationId, sourceMemberId, targetMemberId) {
        const query = `mutation{requestTransferMemberResources(
      organizationId:"${organizationId}", 
      sourceMemberId:"${sourceMemberId}", 
      targetMemberId:"${targetMemberId}", 
      input: { includeWorkspacesOwned: true , includeWorkspacesShared: true, includeTemplatesOwned: true})
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
            organizationRoleId,
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
    async getOrganizationRoleByType(orgnaizationId, attributes, type) {
        const query = `{roles(
      filtering: {
        and: [
          { organizationId: { eq: "${orgnaizationId}" } }
          { resourceType: { eq: Organization } }
          { type: { eq: ${type} } }
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
    async updateOrganizationAutoAssociateIDPUser(organizationId, props) {
        const query = `mutation{updateOrganization(
      organizationId:"${organizationId}", 
      input:{autoAssociateIdentityProviderUser: ${props}}
    ){id}}`;
        const url = this.getUrlForService(types_1.Service.ISAM_GRAPHQL);
        const { data } = await this.request(types_1.FetchRequestType.Post, url, { query });
        return data;
    }
    async addOrganizationToAccount(organizationId, accountId) {
        const path = `/organizations/${organizationId}/accounts`;
        const url = this.getUrlForService(types_1.Service.ISAM, path);
        const payload = {
            accountId,
        };
        try {
            const data = await this.request(types_1.FetchRequestType.Patch, url, {
                ...payload,
            });
            return data;
        }
        catch (error) {
            return { error };
        }
    }
    async getOrganizationIdp(identityProviderId) {
        const path = `/identityProviders/${identityProviderId}`;
        const url = this.getUrlForService(types_1.Service.ISAM, path);
        const payload = {
            identityProviderId,
        };
        try {
            const data = await this.request(types_1.FetchRequestType.Get, url, {
                ...payload,
            });
            return data;
        }
        catch (error) {
            return { error };
        }
    }
}
exports.OrganizationService = OrganizationService;
//# sourceMappingURL=organization.service.js.map