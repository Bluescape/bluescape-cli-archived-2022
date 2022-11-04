"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseOptions = void 0;
exports.baseOptions = {
    profile: { type: 'string', default: 'default' },
    quiet: { type: 'boolean', default: false, alias: 'q' },
    json: { type: 'boolean', conflicts: 'output' },
};
//# sourceMappingURL=shared.js.map