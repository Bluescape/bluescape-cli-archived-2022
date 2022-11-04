"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.valueExists = exports.isId = void 0;
const constants_1 = require("../constants");
const isId = (id) => typeof id === 'string' && constants_1.ID_REGEX.test(id);
exports.isId = isId;
const valueExists = (value) => value !== null && value !== undefined;
exports.valueExists = valueExists;
//# sourceMappingURL=validators.js.map