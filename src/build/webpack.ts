import path from 'path';
import { findProjectRoot, ZEYON_ROOT_ALIAS } from './_util';

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
  // Define an alias to access assets in .Zeyon directory
  let preExistingAlias = userConfig.resolve?.alias || {};

  const alias = {
    ...preExistingAlias,
    ...returnAlias(),
  };

  // Include rule for hbs imports to treat as asset/source (requires webpack 5.0+)
  let rules = userConfig.module?.rules || [];

  // Insert the 'asset/source' rule for .hbs
  rules = rules.filter((rule: { test: RegExp }) => {
    return !rule.test.toString().includes('.hbs');
  });
  rules.push({
    test: /\.hbs$/,
    type: 'asset/source',
  });

  // TODO: Determine if we need additional custom changes, specifically around dynamic bundle splitting

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
