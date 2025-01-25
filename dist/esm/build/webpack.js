import path from 'path';
import { findProjectRoot, ZEYON_ROOT_ALIAS } from './_util';
const returnAlias = () => {
    return { [ZEYON_ROOT_ALIAS]: path.join(findProjectRoot(), '.Zeyon') };
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
export { ZeyonWebpack };
//# sourceMappingURL=webpack.js.map