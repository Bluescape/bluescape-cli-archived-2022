import { Service } from '../types';

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
            configuration: {
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

export const init = () => {
  const profiles = config.get('profiles') || [];
  if (profiles.length == 0) {
    profiles.push({});
    config.set('profiles', profiles);
    config.set('currentProfileIndex', 0);
  }
};

export const getActiveProfile = (): any => {
  init();
  const activeIndex = config.get('currentProfileIndex');
  const profiles = config.get('profiles');
  return profiles[activeIndex];
};

export const getServiceUrl = (serviceName: Service) => {
  const { services } = getActiveProfile();
  switch (serviceName) {
    case Service.ISAM:
      return `${services.isam}/api/v3`;
    case Service.ISAM_GRAPHQL:
      return `${services.isam}/graphql`;
    case Service.PORTAL_API:
      return services.portalApi;
    case Service.COLLAB:
      return services.collab;
    case Service.IDENTITY_API:
      return services.identityApi;
    case Service.CONFIG:
      return services.configuration;
    case Service.UC_CONNECTOR_URL:
      return `${services.ucConnectorUrl}/api/v3`;
  }
};

export const setUserInfo = (user: any) => {
  const activeIndex = config.get('currentProfileIndex');
  const profiles = config.get('profiles');
  const userObj = { ...profiles[activeIndex].user, ...user };
  profiles[activeIndex].user = userObj;
  config.set('profiles', profiles);
};
export const deleteUserInfo = () => {
  const activeIndex = config.get('currentProfileIndex');
  const profiles = config.get('profiles');
  profiles[activeIndex].user = {};
  config.set('profiles', profiles);
};

export const getUserInfo = (key?: string) => {
  const { user } = getActiveProfile();
  return key ? user[key] : user;
};

export const addProfile = (profile: any) => {
  const { name } = profile;
  const profiles = config.get('profiles');
  let index = -1;
  profiles.forEach((profile: any, i: number) => {
    if (name === profile.name) {
      index = i;
    }
  });
  if (index !== -1) {
    profiles[index] = profile;
  } else {
    profiles.push(profile);
    index = profiles.length - 1;
  }
  config.set('profiles', profiles);
  config.set('currentProfileIndex', index);
};
