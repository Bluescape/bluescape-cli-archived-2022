import { ID_REGEX } from '../constants';

export const isId = (id: unknown): boolean =>
  typeof id === 'string' && ID_REGEX.test(id);

  export const valueExists = (value: unknown): boolean =>
  value !== null && value !== undefined;