"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZeyonWebpack = ZeyonWebpack;
const path_1 = __importDefault(require("path"));
const _util_1 = require("./_util");
const returnAlias = () => {
    return { [_util_1.ZEYON_ROOT_ALIAS]: path_1.default.join((0, _util_1.findProjectRoot)(), '.Zeyon') };
};
function ZeyonWebpack(userConfig) {
    let preExistingAlias = userConfig.resolve?.alias || {};
    const alias = {
        ...preExistingAlias,
        ...returnAlias(),
    };
    let rules = userConfig.module?.rules || [];
    rules = rules.filter((rule) => {
        return !rule.test.toString().includes('.hbs');
    });
    rules.push({
        test: /\.hbs$/,
        type: 'asset/source',
    });
    return {
        ...userConfig,
        resolve: {
            ...(userConfig.resolve || {}),
            alias,
        },
        module: {
            ...(userConfig.module || {}),
            rules,
        },
    };
}
ZeyonWebpack.getAliases = returnAlias;
//# sourceMappingURL=webpack.js.map