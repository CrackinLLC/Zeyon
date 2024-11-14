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
export type { CollectionOptions } from './imports/collection';
export type { ModelOptions } from './imports/model';
export type { RouteConfig } from './imports/router';
export { Collection, CollectionView, Emitter, Model, RouteView, Router, View, ZeyonApp };
declare const _default: {
    create: (options: any) => ZeyonApp<any>;
    Collection: typeof Collection;
    CollectionView: typeof CollectionView;
    Emitter: typeof Emitter;
    ZeyonApp: typeof ZeyonApp;
    Model: typeof Model;
    RouteView: typeof RouteView;
    Router: typeof Router;
    View: typeof View;
};
export default _default;
//# sourceMappingURL=_index.d.ts.map