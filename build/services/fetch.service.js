"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchService = void 0;
const axios_1 = __importDefault(require("axios"));
const conf_1 = require("../conf");
const types_1 = require("../types");
const requestTypesWithPayload = [
    types_1.FetchRequestType.Put,
    types_1.FetchRequestType.Post,
    types_1.FetchRequestType.Patch,
];
class FetchService {
    hasPayload(requestType) {
        return requestTypesWithPayload.includes(requestType);
    }
    async addServiceAuthorizationToAxiosConfig(config = {}) {
        const accessToken = (0, conf_1.getUserInfo)('token');
        const headers = config.headers || {};
        if (accessToken) {
            headers.Authorization = `Bearer ${accessToken}`;
        }
        headers['X-Bluescape-Internal'] = 1;
        headers['Cookie'] = `idToken=${accessToken}`;
        return {
            ...config,
            headers: { ...headers },
        };
    }
    getUrlForService(service, path = '') {
        const baseUrl = (0, conf_1.getServiceUrl)(service);
        const normalisedPath = path.charAt(0) === '/' ? path.slice(1) : path;
        return `${baseUrl}/${normalisedPath}`;
    }
    async handlingCommonError(error) {
        const status = error.response?.status || 500;
        if (status > 399) {
            if (status === 401) {
                (0, conf_1.deleteUserInfo)();
                throw new Error('Unauthroised. Pleae login again');
            }
        }
    }
    async request(requestType, url, payload, initialConfig) {
        try {
            const config = await this.addServiceAuthorizationToAxiosConfig(initialConfig);
            const data = this.hasPayload(requestType) ? payload : null;
            const response = await (0, axios_1.default)({
                method: requestType,
                url,
                data,
                ...config,
            });
            return response;
        }
        catch (error) {
            await this.handlingCommonError(error);
            throw error;
        }
    }
}
exports.FetchService = FetchService;
//# sourceMappingURL=fetch.service.js.map