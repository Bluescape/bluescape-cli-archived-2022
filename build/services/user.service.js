"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const types_1 = require("../types");
const validators_1 = require("../utils/validators");
const fetch_service_1 = require("./fetch.service");
class UserService extends fetch_service_1.FetchService {
    constructor() {
        super();
    }
    async getSessionUser() {
        const path = '/users/me';
        const url = this.getUrlForService(types_1.Service.ISAM, path);
        const { data } = await this.request(types_1.FetchRequestType.Get, url);
        return data;
    }
    async getUserId(userId) {
        const path = `/users/${userId}`;
        const url = this.getUrlForService(types_1.Service.ISAM, path);
        const { data } = await this.request(types_1.FetchRequestType.Get, url);
        return data;
    }
    async validateUser(userId) {
        try {
            await this.getUserId(userId);
        }
        catch (error) {
            const status = error.response?.status || 500;
            if (status === 400) {
                throw new Error(`Invalid user id`);
            }
            else if (status === 404) {
                throw new Error(`User not found`);
            }
        }
    }
    async deleteUserById(userId, newOwnerId, isHardDelete = false) {
        const path = `/users/${userId}?newWorkspaceOwnerId=${newOwnerId}&permanent=${isHardDelete}`;
        const url = this.getUrlForService(types_1.Service.ISAM, path);
        const { data } = await this.request(types_1.FetchRequestType.Delete, url);
        return true;
    }
    async getUserFromEmail(email, attributes) {
        const query = `{user(email:"${email}"){${attributes.concat('\n')}}}`;
        const url = this.getUrlForService(types_1.Service.ISAM_GRAPHQL);
        const { data } = await this.request(types_1.FetchRequestType.Post, url, { query });
        return data;
    }
    async getUserById(userId, attributes) {
        const query = `{user(userId:"${userId}"){${attributes.concat('\n')}}}`;
        const url = this.getUrlForService(types_1.Service.ISAM_GRAPHQL);
        const { data } = await this.request(types_1.FetchRequestType.Post, url, { query });
        return data;
    }
    async deleteUserViaGL(userId, newWorkspaceOwnerId, permanentDelete) {
        let includeNewWsOwnerId = '';
        if ((0, validators_1.valueExists)(newWorkspaceOwnerId)) {
            includeNewWsOwnerId = ` newWorkspaceOwnerId: "${newWorkspaceOwnerId}" `;
        }
        const query = `mutation {  deleteUser(    userId:"${userId}" ${includeNewWsOwnerId} permanentDelete: ${permanentDelete}  )}`;
        const url = this.getUrlForService(types_1.Service.ISAM_GRAPHQL);
        const { data } = await this.request(types_1.FetchRequestType.Post, url, { query });
        return data;
    }
    async bulkDeleteUser(userIds, newOwnerId, isHardDelete = false) {
        const path = `/users/bulk_delete?newWorkspaceOwnerId=${newOwnerId}&permanent=${isHardDelete}`;
        const url = this.getUrlForService(types_1.Service.PORTAL_API, path);
        const { data } = await this.request(types_1.FetchRequestType.Delete, url, {
            user_uids: userIds,
            new_workspace_owner_uid: newOwnerId,
            is_permanent_delete: isHardDelete,
        });
        return true;
    }
    async createUserWithoutOrganization(email) {
        const path = `/users`;
        const url = this.getUrlForService(types_1.Service.ISAM, path);
        const data = await this.request(types_1.FetchRequestType.Post, url, {
            email,
        });
        return data;
    }
    async getUserOrganizationsExcludingPersonalSpace(userId, pageSize) {
        const path = `/users/${userId}/organizations?pageSize=${pageSize}&filterBy=mode ne "basic"`;
        const url = this.getUrlForService(types_1.Service.ISAM, path);
        let data;
        try {
            data = await this.request(types_1.FetchRequestType.Get, url);
            return data;
        }
        catch (error) {
            return { error };
        }
    }
    async updateUserEmail(userId, email, attributes) {
        const query = `mutation { updateUser(
      userId: "${userId}"
      input: { email: "${email}" }
    ) {
      ${attributes.concat('\n')}
    }}`;
        const url = this.getUrlForService(types_1.Service.ISAM_GRAPHQL);
        const { data } = await this.request(types_1.FetchRequestType.Post, url, { query });
        return data;
    }
}
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map