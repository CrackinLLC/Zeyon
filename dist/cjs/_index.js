"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const loader = __importStar(require("./util/loader"));
const object = __importStar(require("./util/object"));
const string = __importStar(require("./util/string"));
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
    string,
    loader,
    object,
};
//# sourceMappingURL=_index.js.map