import path from 'path';
import { findProjectRoot, ZEYON_ROOT_ALIAS } from '../util/build';
const returnAlias = () => {
    return { [ZEYON_ROOT_ALIAS]: path.join(findProjectRoot(), '.Zeyon') };
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
export { ZeyonWebpack };
//# sourceMappingURL=webpack.js.map