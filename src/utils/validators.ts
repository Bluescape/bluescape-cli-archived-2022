import {
  EXTERNAL_SUBSCRIPTION_ID_REGEX,
  ID_REGEX,
  NUMBER_REGEX,
} from '../constants';

export const isId = (id: unknown): boolean =>
  typeof id === 'string' && ID_REGEX.test(id);

export const valueExists = (value: unknown): boolean =>
  value !== null && value !== undefined;

export const isExternalSubscriptionId = (id: unknown): boolean =>
  typeof id === 'string' && EXTERNAL_SUBSCRIPTION_ID_REGEX.test(id);

export const isNumber = (value: unknown): boolean =>
  typeof value === 'string' && NUMBER_REGEX.test(value);
