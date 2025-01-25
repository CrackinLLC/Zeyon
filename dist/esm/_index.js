import Collection from './collection';
import CollectionView from './collectionView';
import Emitter from './emitter';
import Model from './model';
import RouteView from './routeView';
import View from './view';
function registerClass(registrationId, props = {}) {
    return function (constructor) {
        if (constructor.prototype.hasOwnProperty('constructor')) {
            console.warn(`Class ${registrationId} defines its own constructor. This is discouraged. Instead, define an 'initialize' method that is run when instantiating.`);
        }
        constructor.registrationId = registrationId;
        Object.entries(props).forEach(([name, value]) => {
            constructor[name] = value;
        });
        return constructor;
    };
}
export default {
    registerEmitter(registrationId, props) { },
    registerModel(registrationId, props) {
        return function (constructor) {
            const decoratedClass = registerClass(registrationId)(constructor);
            if (props?.attributes) {
                decoratedClass.definition = {
                    ...decoratedClass.definition,
                    ...props.attributes,
                };
            }
            return decoratedClass;
        };
    },
    registerCollection(registrationId, props) {
        return function (constructor) {
            return registerClass(registrationId, props)(constructor);
        };
    },
    registerView(registrationId, props) {
        return function (constructor) {
            return registerClass(registrationId, props)(constructor);
        };
    },
    registerRouteView(registrationId, props) {
        return function (constructor) {
            return registerClass(registrationId, props)(constructor);
        };
    },
    registerCollectionView(registrationId, props) {
        return function (constructor) {
            return registerClass(registrationId, props)(constructor);
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