import '../util/polyfill';
import '../util/template';
import ZeyonApp from './app';
import Router from './router';
import Collection from './collection';
import CollectionView from './collectionView';
import Emitter from './emitter';
import Model from './model';
import RouteView from './routeView';
import View from './view';
export { Collection, CollectionView, Emitter, Model, Router, RouteView, View, ZeyonApp };
export default {
    create: (options) => new ZeyonApp(options),
    registerClass(registrationId) {
        return function (constructor) {
            if (constructor.prototype.hasOwnProperty('constructor')) {
                console.warn(`Class ${registrationId} defines its own constructor. This is discouraged. Include an 'initialize' method instead.`);
            }
            constructor.registrationId = registrationId;
            return constructor;
        };
    },
    Collection,
    CollectionView,
    Emitter,
    Model,
    RouteView,
    Router,
    View,
};
//# sourceMappingURL=_index.js.map