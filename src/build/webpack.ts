import path from 'path';
import { findProjectRoot, ZEYON_ROOT_ALIAS } from '../util/build';

/**
 * ZeyonWebpack modifies a given Webpack config
 * to alias our .Zeyon output folder as `zeyonRoot`.
 *
 * Usage in user's webpack.config.js:
 *   import { ZeyonWebpack } from 'zeyon';
 *   export default ZeyonWebpack({ /* user config * / });
 */
const returnAlias = () => {
  return { [ZEYON_ROOT_ALIAS]: path.join(findProjectRoot(), '.Zeyon') };
};

function ZeyonWebpack(userConfig: any): any {
  let preExistingAlias = userConfig.resolve?.alias || {};

  const alias = {
    ...preExistingAlias,
    ...returnAlias(),
  };

  // TODO: Determine if we need additional custom changes, specifically around dynamic bundle splitting

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
