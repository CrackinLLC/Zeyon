import './util/polyfill';
import './util/template';
import ZeyonApp from './app';
export default {
    create: (options) => {
        options.el.innerHTML = '';
        return new ZeyonApp(options);
    },
    defineRoutes(routes) {
        return routes;
    },
};
//# sourceMappingURL=_newApp.js.map