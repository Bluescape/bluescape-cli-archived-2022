"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const types_1 = require("../types");
const fetch_service_1 = require("./fetch.service");
class ConfigService extends fetch_service_1.FetchService {
    constructor() {
        super();
    }
    async get(inputUrl) {
        const path = '/';
        const url = inputUrl
            ? inputUrl
            : this.getUrlForService(types_1.Service.CONFIG, path);
        const { data } = await this.request(types_1.FetchRequestType.Get, url);
        return data;
    }
}
exports.ConfigService = ConfigService;
//# sourceMappingURL=config.service.js.map