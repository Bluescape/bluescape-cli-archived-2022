"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountService = void 0;
const types_1 = require("../types");
const fetch_service_1 = require("./fetch.service");
class AccountService extends fetch_service_1.FetchService {
    constructor() {
        super();
    }
    async getAccountById(accountId) {
        const path = `/accounts/${accountId}`;
        const url = this.getUrlForService(types_1.Service.ISAM, path);
        try {
            const data = await this.request(types_1.FetchRequestType.Get, url);
            return data;
        }
        catch (error) {
            return { error };
        }
    }
}
exports.AccountService = AccountService;
//# sourceMappingURL=account.service.js.map