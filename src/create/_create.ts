import 'zeyon/_maps';
import '../util/polyfill';
import '../util/template';

import ZeyonApp from '../app';
import type { ZeyonAppOptions } from '../imports/app';
import type { RouteConfig } from '../imports/router';

export { ZeyonApp, ZeyonAppOptions };

export default {
  create: (options: any) => {
    options.el.innerHTML = '';
    return new ZeyonApp(options);
  },

  /**
   * Used to ensure custom route properties conform to the interface supplied by the developer
   * @param routes
   * @returns
   */
  defineRoutes<CustomRouteProps extends {} = {}>(
    routes: RouteConfig<CustomRouteProps>[],
  ): RouteConfig<CustomRouteProps>[] {
    return routes;
  },
};
