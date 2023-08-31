"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addProfile = exports.getUserInfo = exports.deleteUserInfo = exports.setUserInfo = exports.getServiceUrl = exports.getActiveProfile = exports.init = void 0;
const types_1 = require("../types");
const Conf = require('conf');
const schema = {
    currentProfileIndex: {
        type: 'number',
        default: 0,
    },
    profiles: {
        type: 'array',
        items: {
            type: 'object',
            default: {},
            properties: {
                name: {
                    type: 'string',
                    default: 'us',
                },
                active: {
                    type: 'boolean',
                    default: false,
                },
                services: {
                    type: 'object',
                    default: {},
                    properties: {
                        config: {
                            type: 'string',
                            default: 'https://config.apps.us.bluescape.com',
                            format: 'url',
                        },
                        isam: {
                            type: 'string',
                            default: 'https://isam.apps.us.bluescape.com',
                            format: 'url',
                        },
                        portalApi: {
                            type: 'string',
                            default: 'https://portal-api.apps.us.bluescape.com',
                            format: 'url',
                        },
                        collab: {
                            type: 'string',
                            default: 'https://collab.apps.us.bluescape.com',
                            format: 'url',
                        },
                        identityApi: {
                            type: 'string',
                            default: 'https://identity-api.apps.us.bluescape.com',
                            format: 'url',
                        },
                        ucConnectorUrl: {
                            type: 'string',
                            default: 'https://uc-connector.apps.us.bluescape.com',
                            format: 'url',
                        },
                    },
                },
                user: {
                    type: 'object',
                    default: {},
                    properties: {
                        id: {
                            type: 'string',
                        },
                        firstName: {
                            type: 'string',
                        },
                        lastName: {
                            type: 'string',
                        },
                        email: {
                            type: 'string',
                        },
                        token: {
                            type: 'string',
                        },
                    },
                },
            },
        },
    },
};
const config = new Conf({
    encryptionKey: 'gyjcdyitfuykghfkhjfhvgfgfhjhfgfjfhf',
    schema,
});
const init = () => {
    const profiles = config.get('profiles') || [];
    if (profiles.length == 0) {
        profiles.push({});
        config.set('profiles', profiles);
        config.set('currentProfileIndex', 0);
    }
};
exports.init = init;
const getActiveProfile = () => {
    (0, exports.init)();
    const activeIndex = config.get('currentProfileIndex');
    const profiles = config.get('profiles');
    return profiles[activeIndex];
};
exports.getActiveProfile = getActiveProfile;
const getServiceUrl = (serviceName) => {
    const { services } = (0, exports.getActiveProfile)();
    switch (serviceName) {
        case types_1.Service.ISAM:
            return `${services.isam}/api/v3`;
        case types_1.Service.ISAM_GRAPHQL:
            return `${services.isam}/graphql`;
        case types_1.Service.PORTAL_API:
            return services.portalApi;
        case types_1.Service.COLLAB:
            return services.collab;
        case types_1.Service.IDENTITY_API:
            return services.identityApi;
        case types_1.Service.CONFIG:
            return services.config;
        case types_1.Service.UC_CONNECTOR_URL:
            return `${services.ucConnectorUrl}/api/v3`;
    }
};
exports.getServiceUrl = getServiceUrl;
const setUserInfo = (user) => {
    const activeIndex = config.get('currentProfileIndex');
    const profiles = config.get('profiles');
    const userObj = { ...profiles[activeIndex].user, ...user };
    profiles[activeIndex].user = userObj;
    config.set('profiles', profiles);
};
exports.setUserInfo = setUserInfo;
const deleteUserInfo = () => {
    const activeIndex = config.get('currentProfileIndex');
    const profiles = config.get('profiles');
    profiles[activeIndex].user = {};
    config.set('profiles', profiles);
};
exports.deleteUserInfo = deleteUserInfo;
const getUserInfo = (key) => {
    const { user } = (0, exports.getActiveProfile)();
    return key ? user[key] : user;
};
exports.getUserInfo = getUserInfo;
const addProfile = (profile) => {
    const { name } = profile;
    const profiles = config.get('profiles');
    let index = -1;
    profiles.forEach((profile, i) => {
        if (name === profile.name) {
            index = i;
        }
    });
    if (index !== -1) {
        profiles[index] = profile;
    }
    else {
        profiles.push(profile);
        index = profiles.length - 1;
    }
    config.set('profiles', profiles);
    config.set('currentProfileIndex', index);
};
exports.addProfile = addProfile;
//# sourceMappingURL=index.js.map