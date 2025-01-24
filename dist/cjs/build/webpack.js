"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZeyonWebpack = ZeyonWebpack;
const path_1 = __importDefault(require("path"));
const build_1 = require("../util/build");
const returnAlias = () => {
    return { [build_1.ZEYON_ROOT_ALIAS]: path_1.default.join((0, build_1.findProjectRoot)(), '.Zeyon') };
};
function ZeyonWebpack(userConfig) {
    let preExistingAlias = userConfig.resolve?.alias || {};
    const alias = {
        ...preExistingAlias,
        ...returnAlias(),
    };
    return {
        ...userConfig,
        resolve: {
            ...(userConfig.resolve || {}),
            alias,
        },
    };
}
ZeyonWebpack.getAliases = returnAlias;
//# sourceMappingURL=webpack.js.map