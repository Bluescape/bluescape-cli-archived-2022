export const ID_LENGTH = 20;

export const ID_REGEX = new RegExp(`^[A-Za-z0-9-_]{${ID_LENGTH}}$`);
export const EXTERNAL_SUBSCRIPTION_ID_REGEX = new RegExp(
  `^[A-Za-z0-9-_]{2,50}$`,
);
