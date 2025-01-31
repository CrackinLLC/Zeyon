import '../_maps';
import '../util/polyfill';
import '../util/template';
import ZeyonApp from '../app';
export { ZeyonApp };
export default {
    create: (options) => {
        options.el.innerHTML = '';
        return new ZeyonApp(options);
    },
    defineRoutes(routes) {
        return routes;
    },
};
//# sourceMappingURL=_create.js.map