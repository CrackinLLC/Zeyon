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
function registerClass(registrationId) {
    return function (constructor) {
        if (constructor.prototype.hasOwnProperty('constructor')) {
            console.warn(`Class ${registrationId} defines its own constructor. This is discouraged. Instead, define an 'initialize' method that is run when instantiating.`);
        }
        constructor.registrationId = registrationId;
        return constructor;
    };
}
export { Collection, CollectionView, Emitter, Model, Router, RouteView, View, ZeyonApp };
export default {
    create: (options) => new ZeyonApp(options),
    registerView(registrationId) {
        return function (constructor) {
            const decoratedClass = registerClass(registrationId)(constructor);
            return decoratedClass;
        };
    },
    registerRouteView(registrationId) {
        return function (constructor) {
            const decoratedClass = registerClass(registrationId)(constructor);
            return decoratedClass;
        };
    },
    registerModel(registrationId, options) {
        return function (constructor) {
            const decoratedClass = registerClass(registrationId)(constructor);
            if (options?.attributes) {
                decoratedClass.definition = {
                    ...decoratedClass.definition,
                    ...options.attributes,
                };
            }
            return decoratedClass;
        };
    },
    registerCollection(registrationId) {
        return function (constructor) {
            const decoratedClass = registerClass(registrationId)(constructor);
            return decoratedClass;
        };
    },
    registerCollectionView(registrationId) {
        return function (constructor) {
            const decoratedClass = registerClass(registrationId)(constructor);
            return decoratedClass;
        };
    },
    defineRoutes(routes) {
        return routes;
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