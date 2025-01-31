import '../_maps';
import '../util/polyfill';
import '../util/template';
import ZeyonApp from '../app';
import type { ZeyonAppOptions } from '../imports/app';
import type { RouteConfig } from '../imports/router';
export { ZeyonApp, ZeyonAppOptions };
declare const _default: {
    create: (options: any) => ZeyonApp;
    defineRoutes<CustomRouteProps extends {} = {}>(routes: RouteConfig<CustomRouteProps>[]): RouteConfig<CustomRouteProps>[];
};
export default _default;
//# sourceMappingURL=_create.d.ts.map