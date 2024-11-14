import '../util/polyfill';
import '../util/template';
import ZeyonApp from './app';
import Collection from './collection';
import CollectionView from './collectionView';
import Emitter from './emitter';
import Model from './model';
import RouteView from './route';
import Router from './router';
import View from './view';
export { Collection, CollectionView, Emitter, Model, RouteView, Router, View, ZeyonApp };
export default {
    create: (options) => new ZeyonApp(options),
    Collection,
    CollectionView,
    Emitter,
    ZeyonApp,
    Model,
    RouteView,
    Router,
    View,
};
//# sourceMappingURL=_index.js.map