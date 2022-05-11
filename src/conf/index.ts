import { Service } from "../types";

const Conf = require("conf");

const schema = {
  currentProfileIndex: {
    type: "number",
    default: 0,
  },
  profiles: {
    type: "array",
    items: {
      type: "object",
      default: {},
      properties: {
        name: {
          type: "string",
          default: "us",
        },
        active: {
          type: "boolean",
          default: false,
        },
        services: {
          type: "object",
          default: {},
          properties: {
            config: {
              type: "string",
              default: "https://config.uat.alpha.dev.bluescape.io",
              format: "url",
            },
            isam: {
              type: "string",
              default: "https://isam.uat.alpha.dev.bluescape.io",
              format: "url",
            },
            portalApi: {
              type: "string",
              default: "https://portal-api.uat.alpha.dev.bluescape.io",
              format: "url",
            },
            collab: {
              type: "string",
              default: "https://collab.uat.alpha.dev.bluescape.io",
              format: "url",
            },
            identityApi: {
              type: "string",
              default: "https://identity-api.uat.alpha.dev.bluescape.io",
              format: "url",
            },
          },
        },
        user: {
          type: "object",
          default: {},
          properties: {
            name: {
              type: "string",
            },
            email: {
              type: "string",
            },
            token: {
              type: "string",
            },
          },
        },
      },
    },
  },
};

const config = new Conf({
  encryptionKey: "gyjcdyitfuykghfkhjfhvgfgfhjhfgfjfhf",
  schema,
});

export const getActiveProfile = (): any => {
  const activeIndex = config.get("currentProfileIndex");
  const profiles = config.get("profiles");
  return profiles[activeIndex];
};

export const getServiceUrl = (serviceName: Service) => {
  const { services } = getActiveProfile();
  switch (serviceName) {
    case Service.ISAM:
      return `${services.isam}/api/v3`;
    case Service.PORTAL_API:
      return services.portalApi;
    case Service.COLLAB:
      return services.collab;
    case Service.IDENTITY_API:
      return services.identityApi;
  }
};

export const getUserInfo = (key: string) => {
  const { user } = getActiveProfile();
  return user[key];
};
