import '../util/polyfill';
import '../util/template';
import ZeyonApp from './app';
import Router from './router';
export type { ZeyonAppOptions } from './imports/app';
export type { RouteConfig } from './imports/router';
import Collection from './collection';
import CollectionView from './collectionView';
import Emitter from './emitter';
import Model from './model';
import RouteView from './routeView';
import View from './view';
export type { CollectionOptions } from './imports/collection';
export type { CollectionViewOptions } from './imports/collectionView';
export type { EmitterOptions } from './imports/emitter';
export type { ModelOptions } from './imports/model';
export type { RouteViewOptions } from './imports/routeView';
export type { ViewOptions } from './imports/view';
export { Collection, CollectionView, Emitter, Model, RouteView, Router, View, ZeyonApp };
declare const _default: {
    create: (options: any) => ZeyonApp<any>;
    registerClass(registrationId: string, meta?: Record<string, any>): <T extends {
        new (...args: any[]): {};
    }>(constructor: T) => T;
    Collection: typeof Collection;
    CollectionView: typeof CollectionView;
    Emitter: typeof Emitter;
    Model: typeof Model;
    RouteView: typeof RouteView;
    Router: typeof Router;
    View: typeof View;
};
export default _default;
//# sourceMappingURL=_index.d.ts.map