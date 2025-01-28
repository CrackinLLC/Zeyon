import Collection from './collection';
import CollectionView from './collectionView';
import Emitter from './emitter';
import Model from './model';
import RouteView from './routeView';
import View from './view';
export default {
    registerEmitter(registrationId, props) {
        return function (constructor) {
            console.log('Emitter decorated with:', registrationId, props);
            return constructor;
        };
    },
    registerModel(registrationId, props) {
        return function (constructor) {
            console.log('Model decorated with:', registrationId, props);
            return constructor;
        };
    },
    registerCollection(registrationId, props) {
        return function (constructor) {
            console.log('Collection decorated with:', registrationId, props);
            return constructor;
        };
    },
    registerView(registrationId, props) {
        return function (constructor) {
            console.log('View decorated with:', registrationId, props);
            return constructor;
        };
    },
    registerRouteView(registrationId, props) {
        return function (constructor) {
            console.log('RouteView decorated with:', registrationId, props);
            return constructor;
        };
    },
    registerCollectionView(registrationId, props) {
        return function (constructor) {
            console.log('CollectionView decorated with:', registrationId, props);
            return constructor;
        };
    },
    Emitter,
    Model,
    Collection,
    View,
    RouteView,
    CollectionView,
};
//# sourceMappingURL=_index.js.map