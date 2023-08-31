"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const types_1 = require("../types");
const fetch_service_1 = require("./fetch.service");
class AuthService extends fetch_service_1.FetchService {
    constructor() {
        super();
    }
    tokenParser(headers) {
        const cookie = headers['set-cookie'] || [''];
        const [regOutput] = cookie.filter((cookieInfo) => cookieInfo.indexOf('idToken') != -1);
        const token = regOutput.match(/^idToken=([^;]*);*/);
        return token.length > 0 ? token[1] : null;
    }
    async login(username, password) {
        try {
            const path = '/authenticate';
            const url = this.getUrlForService(types_1.Service.ISAM, path);
            const response = await this.request(types_1.FetchRequestType.Post, url, {
                email: username,
                password,
            });
            const { headers } = response;
            return this.tokenParser(headers);
        }
        catch (error) {
            if (error.isAxiosError) {
                const { response: { data }, } = error;
                if (data) {
                    throw new Error(`Login Failed: ${data.message}`);
                }
            }
            throw error;
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map