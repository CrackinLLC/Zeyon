"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const collection_1 = __importDefault(require("./collection"));
const collectionView_1 = __importDefault(require("./collectionView"));
const emitter_1 = __importDefault(require("./emitter"));
const model_1 = __importDefault(require("./model"));
const routeView_1 = __importDefault(require("./routeView"));
const view_1 = __importDefault(require("./view"));
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
exports.default = {
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
    Emitter: emitter_1.default,
    Model: model_1.default,
    Collection: collection_1.default,
    View: view_1.default,
    RouteView: routeView_1.default,
    CollectionView: collectionView_1.default,
};
//# sourceMappingURL=_index.js.map