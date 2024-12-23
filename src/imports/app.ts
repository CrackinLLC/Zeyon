import type Collection from '../collection';
import type CollectionView from '../collectionView';
import type {
  ClassMapKey,
  ClassMapTypeCollection,
  ClassMapTypeCollectionView,
  ClassMapTypeModel,
  ClassMapTypeRouteView,
  ClassMapTypeView,
} from '../generated/ClassMapType';
import type Model from '../model';
import type Router from '../router';
import type RouteView from '../routeView';
import type View from '../view';
import type { RouteConfig } from './router';
import type { ViewOptions } from './view';

export interface ZeyonAppOptions {
  name?: string;
  el: HTMLElement;
  urlPrefix?: string;
}

export interface GlobalViewConfig {
  registrationId: ClassMapKey;
  selector: string;
  options?: ViewOptions;
}

export interface ZeyonAppLike<CustomRouteProps = any> {
  name: string;
  el: HTMLElement;
  isStarted: boolean;
  isReady: Promise<this>;
  router: Router<CustomRouteProps>;
  window: Window;
  options: ZeyonAppOptions;

  registerRoutes<C extends CustomRouteProps>(routes: RouteConfig<C>[]): this;
  setGlobalViews(layouts: GlobalViewConfig | GlobalViewConfig[]): this;
  start(): Promise<this>;
  navigate(urlFragment: string, openNewTab?: boolean): this;

  newView<K extends keyof ClassMapTypeView>(
    registrationId: K,
    options?: ClassMapTypeView[K]['options'],
  ): Promise<ClassMapTypeView[K] & View>;

  newRouteView<K extends keyof ClassMapTypeRouteView>(
    registrationId: K,
    options?: ClassMapTypeRouteView[K]['options'],
  ): Promise<ClassMapTypeRouteView[K] & RouteView>;

  newModel<K extends keyof ClassMapTypeModel>(
    registrationId: K,
    options?: ClassMapTypeModel[K]['options'],
  ): Promise<Model>;

  newCollection<K extends keyof ClassMapTypeCollection>(
    registrationId: K,
    options?: ClassMapTypeCollection[K]['options'],
  ): Promise<ClassMapTypeCollection[K] & Collection>;

  newCollectionView<K extends keyof ClassMapTypeCollectionView>(
    registrationId: K,
    options?: ClassMapTypeCollectionView[K]['options'],
  ): Promise<ClassMapTypeCollectionView[K] & CollectionView>;

  toggleClass(className: string, add?: boolean): this;
  setLoadingState(show?: boolean): boolean;
}
