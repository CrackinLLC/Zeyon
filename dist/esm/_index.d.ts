import './_maps';
import './util/polyfill';
import './util/template';
import ZeyonApp from './app';
import type { ZeyonAppOptions } from './imports/app';
import { AttributeDefinition } from './imports/model';
import type { RouteConfig } from './imports/router';
import Router from './router';
import Collection from './collection';
import CollectionView from './collectionView';
import Emitter from './emitter';
import Model from './model';
import RouteView from './routeView';
import View from './view';
interface BaseProps {
}
interface RegisterViewProps extends BaseProps {
    isComponent?: boolean;
    template?: string;
    templateWrapper?: string;
}
interface RegisterRouteViewOptions extends RegisterViewProps {
}
interface RegisterModelOptions {
    attributes: Record<string, AttributeDefinition>;
}
export type { CollectionOptions } from './imports/collection';
export type { CollectionViewOptions } from './imports/collectionView';
export type { EmitterOptions } from './imports/emitter';
export type { ModelOptions } from './imports/model';
export type { RouteViewOptions } from './imports/routeView';
export type { ViewOptions } from './imports/view';
export { Collection, CollectionView, Emitter, Model, RouteConfig, Router, RouteView, View, ZeyonApp, ZeyonAppOptions };
export { ZeyonWebpack } from './build/webpack';
declare const _default: {
    create: (options: any) => ZeyonApp;
    registerView(registrationId: string, props?: RegisterViewProps): <T extends {
        new (...args: any[]): {};
    }>(constructor: T) => T;
    registerRouteView(registrationId: string, props?: RegisterRouteViewOptions): <T extends {
        new (...args: any[]): {};
    }>(constructor: T) => T;
    registerModel(registrationId: string, options?: RegisterModelOptions): <T extends {
        new (...args: any[]): {};
    }>(constructor: T) => T;
    registerCollection(registrationId: string): <T extends {
        new (...args: any[]): {};
    }>(constructor: T) => T;
    registerCollectionView(registrationId: string): <T extends {
        new (...args: any[]): {};
    }>(constructor: T) => T;
    defineRoutes<CustomRouteProps extends {} = {}>(routes: RouteConfig<CustomRouteProps>[]): RouteConfig<CustomRouteProps>[];
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