import type Collection from './collection';
import type CollectionView from './collectionView';
import type { ClassMapTypeCollection, ClassMapTypeCollectionView, ClassMapTypeModel, ClassMapTypeRouteView, ClassMapTypeView } from './generated/ClassMapType';
import type { GlobalViewConfig, ZeyonAppOptions } from './imports/app';
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
    setGlobalViews(layouts: GlobalViewConfig | GlobalViewConfig[]): this;
    start(): Promise<this>;
    navigate(urlFragment: string, openNewTab?: boolean): this;
    newView<K extends keyof ClassMapTypeView>(registrationId: K, options?: ClassMapTypeView[K]['options']): Promise<ClassMapTypeView[K] & View>;
    newRouteView<K extends keyof ClassMapTypeRouteView>(registrationId: K, options?: ClassMapTypeRouteView[K]['options']): Promise<ClassMapTypeRouteView[K] & RouteView>;
    newModel<K extends keyof ClassMapTypeModel>(registrationId: K, options?: ClassMapTypeModel[K]['options']): Promise<Model>;
    newCollection<K extends keyof ClassMapTypeCollection>(registrationId: K, options?: ClassMapTypeCollection[K]['options']): Promise<ClassMapTypeCollection[K] & Collection>;
    newCollectionView<K extends keyof ClassMapTypeCollectionView>(registrationId: K, options?: ClassMapTypeCollectionView[K]['options']): Promise<ClassMapTypeCollectionView[K] & CollectionView>;
    private newInstance;
    toggleClass(className: string, add?: boolean): this;
    setLoadingState(show?: boolean): boolean;
}
//# sourceMappingURL=app.d.ts.map