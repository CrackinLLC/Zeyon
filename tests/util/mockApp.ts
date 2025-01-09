import type Collection from '../../src/collection';
import type CollectionView from '../../src/collectionView';
import type Emitter from '../../src/emitter';
import type {
  ClassMapKey,
  ClassMapTypeCollection,
  ClassMapTypeCollectionView,
  ClassMapTypeModel,
  ClassMapTypeRouteView,
  ClassMapTypeView,
} from '../../src/generated/ClassMapType';
import type { GlobalViewConfig, ZeyonAppLike, ZeyonAppOptions } from '../../src/imports/app';
import type Model from '../../src/model';
import type Router from '../../src/router';
import type RouteView from '../../src/routeView';
import type View from '../../src/view';

export class MockZeyonApp<CustomRouteProps = any> implements ZeyonAppLike {
  public name = '';
  public el: HTMLElement;
  public isStarted = false;
  public isReady: Promise<this>;
  public router: Router;
  public window: Window;

  constructor(
    public options: ZeyonAppOptions = {
      el: document.createElement('div'),
      routes: [],
    },
  ) {
    this.isReady = new Promise<this>((resolve) => resolve(this));
    this.el = options.el;
    this.name = options.name || '';
    this.window = window;
  }

  public renderGlobalView(layouts: GlobalViewConfig | GlobalViewConfig[]): this {
    return this;
  }

  public async start(): Promise<this> {
    return this;
  }

  public navigate(urlFragment: string, openNewTab = false): this {
    return this;
  }

  public async newView<K extends keyof ClassMapTypeView>(
    registrationId: K,
    options?: ClassMapTypeView[K]['options'],
  ): Promise<ClassMapTypeView[K] & View> {
    const stub: Partial<View> = {
      async render(): Promise<View> {
        return stub as View;
      },
    };

    return stub as ClassMapTypeView[K] & View;
  }

  public async newRouteView<K extends keyof ClassMapTypeRouteView>(
    registrationId: K,
    options?: ClassMapTypeRouteView[K]['options'],
  ): Promise<ClassMapTypeRouteView[K] & RouteView> {
    const stub: Partial<RouteView> = {
      async render(): Promise<RouteView> {
        return stub as RouteView;
      },
    };

    return stub as ClassMapTypeRouteView[K] & RouteView;
  }

  public async newModel<K extends keyof ClassMapTypeModel>(
    registrationId: K,
    options?: ClassMapTypeModel[K]['options'],
  ): Promise<Model> {
    return {} as Model;
  }

  public async newCollection<K extends keyof ClassMapTypeCollection>(
    registrationId: K,
    options?: ClassMapTypeCollection[K]['options'],
  ): Promise<ClassMapTypeCollection[K] & Collection> {
    return {} as ClassMapTypeCollection[K] & Collection;
  }

  public async newCollectionView<K extends keyof ClassMapTypeCollectionView>(
    registrationId: K,
    options?: ClassMapTypeCollectionView[K]['options'],
  ): Promise<ClassMapTypeCollectionView[K] & CollectionView> {
    return {} as ClassMapTypeCollectionView[K] & CollectionView;
  }

  protected async newInstance<K extends ClassMapKey, T extends Emitter = Emitter>(
    registrationId: K,
    options?: unknown,
  ): Promise<T> {
    return {} as T;
  }

  public toggleClass(className: string, add?: boolean): this {
    return this;
  }

  public setLoadingState(show?: boolean): boolean {
    return false;
  }
}
