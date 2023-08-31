"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNumber = exports.isExternalSubscriptionId = exports.valueExists = exports.isId = void 0;
const constants_1 = require("../constants");
const isId = (id) => typeof id === 'string' && constants_1.ID_REGEX.test(id);
exports.isId = isId;
const valueExists = (value) => value !== null && value !== undefined;
exports.valueExists = valueExists;
const isExternalSubscriptionId = (id) => typeof id === 'string' && constants_1.EXTERNAL_SUBSCRIPTION_ID_REGEX.test(id);
exports.isExternalSubscriptionId = isExternalSubscriptionId;
const isNumber = (value) => typeof value === 'string' && constants_1.NUMBER_REGEX.test(value);
exports.isNumber = isNumber;
//# sourceMappingURL=validators.js.map