"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJsonFromCSV = void 0;
const csvtojson_1 = __importDefault(require("csvtojson"));
const getJsonFromCSV = async (filePath) => {
    const json = await (0, csvtojson_1.default)({
        trim: true,
    }).fromFile(filePath);
    return json;
};
exports.getJsonFromCSV = getJsonFromCSV;
//# sourceMappingURL=csv.js.map