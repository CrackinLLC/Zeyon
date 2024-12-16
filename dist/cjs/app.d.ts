import type Collection from './collection';
import type CollectionView from './collectionView';
import type { ClassMapType } from './generated/ClassMapType';
import type { GlobalViewConfig, ZeyonAppOptions } from './imports/app';
import type { Attributes } from './imports/model';
import { RouteConfig } from './imports/router';
import type Model from './model';
import Router from './router';
import type RouteView from './routeView';
import type View from './view';
export default class ZeyonApp<CustomRouteProps = any> {
    options: ZeyonAppOptions;
    name: string;
    el: HTMLElement;
    isStarted: boolean;
    isReady: Promise<this>;
    private resolveIsReady;
    router: Router;
    window: Window;
    private registry;
    private loadingState;
    constructor(options: ZeyonAppOptions);
    registerRoutes<C extends CustomRouteProps>(routes: RouteConfig<C>[]): this;
    setGlobalViews(layouts: GlobalViewConfig[]): this;
    start(): Promise<this>;
    navigate(urlFragment: string, openNewTab?: boolean): this;
    newView<K extends keyof ClassMapType>(registrationId: K, options?: any): Promise<ClassMapType[K] & View>;
    newRouteView<K extends keyof ClassMapType>(registrationId: K, options?: any): Promise<ClassMapType[K] & RouteView>;
    newModel<K extends keyof ClassMapType>(registrationId: K, options?: any): Promise<ClassMapType[K] & Model<Attributes>>;
    newCollection<K extends keyof ClassMapType>(registrationId: K, options?: any): Promise<ClassMapType[K] & Collection<Attributes, Model<Attributes>>>;
    newCollectionView<K extends keyof ClassMapType>(registrationId: K, options?: any): Promise<ClassMapType[K] & CollectionView>;
    private newInstance;
    toggleClass(className: string, add?: boolean): this;
    setLoadingState(show?: boolean): boolean;
}
//# sourceMappingURL=app.d.ts.map