"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NUMBER_REGEX = exports.EXTERNAL_SUBSCRIPTION_ID_REGEX = exports.ID_REGEX = exports.ID_LENGTH = void 0;
exports.ID_LENGTH = 20;
exports.ID_REGEX = new RegExp(`^[A-Za-z0-9-_]{${exports.ID_LENGTH}}$`);
exports.EXTERNAL_SUBSCRIPTION_ID_REGEX = new RegExp(`^[A-Za-z0-9-_]{2,50}$`);
exports.NUMBER_REGEX = new RegExp('^[0-9]+$');
//# sourceMappingURL=constants.js.map