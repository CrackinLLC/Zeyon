import './util/polyfill';
import './util/template';
import ZeyonApp from './app';
import type { RouteConfig } from './imports/router';
declare const _default: {
    create: (options: any) => ZeyonApp;
    defineRoutes<CustomRouteProps extends {} = {}>(routes: RouteConfig<CustomRouteProps>[]): RouteConfig<CustomRouteProps>[];
};
export default _default;
//# sourceMappingURL=_newApp.d.ts.map