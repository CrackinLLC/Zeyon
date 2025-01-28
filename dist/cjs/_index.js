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
exports.default = {
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
    Emitter: emitter_1.default,
    Model: model_1.default,
    Collection: collection_1.default,
    View: view_1.default,
    RouteView: routeView_1.default,
    CollectionView: collectionView_1.default,
};
//# sourceMappingURL=_index.js.map