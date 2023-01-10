"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchRequestType = exports.Service = void 0;
var Service;
(function (Service) {
    Service[Service["ISAM"] = 0] = "ISAM";
    Service[Service["ISAM_GRAPHQL"] = 1] = "ISAM_GRAPHQL";
    Service[Service["PORTAL_API"] = 2] = "PORTAL_API";
    Service[Service["IDENTITY_API"] = 3] = "IDENTITY_API";
    Service[Service["COLLAB"] = 4] = "COLLAB";
    Service[Service["CONFIG"] = 5] = "CONFIG";
    Service[Service["UC_CONNECTOR_URL"] = 6] = "UC_CONNECTOR_URL";
})(Service = exports.Service || (exports.Service = {}));
var FetchRequestType;
(function (FetchRequestType) {
    FetchRequestType["Get"] = "get";
    FetchRequestType["Delete"] = "delete";
    FetchRequestType["Head"] = "head";
    FetchRequestType["Post"] = "post";
    FetchRequestType["Put"] = "put";
    FetchRequestType["Patch"] = "patch";
})(FetchRequestType = exports.FetchRequestType || (exports.FetchRequestType = {}));
//# sourceMappingURL=types.js.map