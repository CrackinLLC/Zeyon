import type {
  ClassMapTypeCollection,
  ClassMapTypeCollectionView,
  ClassMapTypeModel,
  ClassMapTypeRouteView,
  ClassMapTypeView,
} from '../_maps';
import type { RouteConfig } from './router';
import type { ViewOptions } from './view';

export interface ZeyonAppOptions {
  el: HTMLElement;
  routes: RouteConfig[];
  name?: string;
  urlPrefix?: string;
}

export interface GlobalViewConfig {
  registrationId: keyof ClassMapTypeView;
  selector: string;
  options?: ViewOptions;
}

export interface ZeyonAppLike {
  options: ZeyonAppOptions;

  name: string;
  el: HTMLElement;
  isStarted: boolean;
  isReady: Promise<this>;
  window: Window;

  start(): Promise<this>;
  navigate(urlFragment: string, openNewTab?: boolean): this;

  newView<K extends keyof ClassMapTypeView>(
    registrationId: K,
    options?: ClassMapTypeView[K]['options'],
  ): Promise<InstanceType<ClassMapTypeView[K]['classRef']>>;

  renderNewView<K extends keyof ClassMapTypeView>(
    registrationId: K,
    options?: ClassMapTypeView[K]['options'],
  ): Promise<this>;

  newRouteView<K extends keyof ClassMapTypeRouteView>(
    registrationId: K,
    options?: ClassMapTypeRouteView[K]['options'],
  ): Promise<InstanceType<ClassMapTypeRouteView[K]['classRef']>>;

  newModel<K extends keyof ClassMapTypeModel>(
    registrationId: K,
    options?: ClassMapTypeModel[K]['options'],
  ): Promise<InstanceType<ClassMapTypeModel[K]['classRef']>>;

  newCollection<K extends keyof ClassMapTypeCollection>(
    registrationId: K,
    options?: ClassMapTypeCollection[K]['options'],
  ): Promise<InstanceType<ClassMapTypeCollection[K]['classRef']>>;

  newCollectionView<K extends keyof ClassMapTypeCollectionView>(
    registrationId: K,
    options?: ClassMapTypeCollectionView[K]['options'],
  ): Promise<InstanceType<ClassMapTypeCollectionView[K]['classRef']>>;

  toggleClass(className: string, add?: boolean): this;
  setLoadingState(show?: boolean): boolean;
}
