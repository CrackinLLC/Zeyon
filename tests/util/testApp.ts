import type {
  Attributes,
  ClassCategory,
  ClassMapTypeCollection,
  ClassMapTypeCollectionView,
  ClassMapTypeModel,
  ClassMapTypeRouteView,
  ClassMapTypeView,
  CollectionOptions,
  CollectionViewOptions,
  ModelOptions,
  NavigateOptions,
  RouteViewOptions,
  ViewOptions,
  ZeyonAppLike,
  ZeyonAppOptions,
} from 'zeyon/imports';
import type Router from '../../dist/esm/router';
import type View from '../../dist/esm/view';
import { TestCollection } from './testCollection';
import { TestCollectionView } from './TestCollectionView';
import { TestModel } from './testModel';
import { TestRouteView } from './testRouteView';
import { TestView } from './testView';

export class TestZeyonApp implements ZeyonAppLike {
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

  public async start(): Promise<this> {
    return this;
  }

  public navigate(options: NavigateOptions): this {
    return this;
  }

  public newView<K extends string>(
    registrationId: K,
    options?: K extends keyof ClassMapTypeView ? ClassMapTypeView[K]['options'] : ViewOptions,
  ): Promise<K extends keyof ClassMapTypeView ? InstanceType<ClassMapTypeView[K]['classRef']> : never> {
    const view = new TestView(options || {}, this);
    return Promise.resolve(
      view as unknown as K extends keyof ClassMapTypeView ? InstanceType<ClassMapTypeView[K]['classRef']> : never,
    );
  }

  public async renderNewView<K extends string>(
    registrationId: K,
    options?: K extends keyof ClassMapTypeView ? ClassMapTypeView[K]['options'] : ViewOptions,
  ): Promise<this> {
    new TestRouteView(options || {}, this);
    return Promise.resolve(this);
  }

  public async newRouteView<K extends string>(
    registrationId: K,
    options?: K extends keyof ClassMapTypeRouteView ? ClassMapTypeRouteView[K]['options'] : RouteViewOptions,
  ): Promise<K extends keyof ClassMapTypeRouteView ? InstanceType<ClassMapTypeRouteView[K]['classRef']> : never> {
    const routeView = new TestRouteView(options || {}, this);
    return Promise.resolve(
      routeView as unknown as K extends keyof ClassMapTypeRouteView
        ? InstanceType<ClassMapTypeRouteView[K]['classRef']>
        : never,
    );
  }

  public newModel<K extends string>(
    registrationId: K,
    options?: K extends keyof ClassMapTypeModel ? ClassMapTypeModel[K]['options'] : ModelOptions<Attributes>,
  ): Promise<K extends keyof ClassMapTypeModel ? InstanceType<ClassMapTypeModel[K]['classRef']> : never> {
    const model = new TestModel(options || {}, this);
    return Promise.resolve(
      model as unknown as K extends keyof ClassMapTypeModel ? InstanceType<ClassMapTypeModel[K]['classRef']> : never,
    );
  }

  public newCollection<K extends string>(
    registrationId: K,
    options?: K extends keyof ClassMapTypeCollection ? ClassMapTypeCollection[K]['options'] : CollectionOptions,
  ): Promise<K extends keyof ClassMapTypeCollection ? InstanceType<ClassMapTypeCollection[K]['classRef']> : never> {
    const collection = new TestCollection(options || {}, this);
    return Promise.resolve(
      collection as unknown as K extends keyof ClassMapTypeCollection
        ? InstanceType<ClassMapTypeCollection[K]['classRef']>
        : never,
    );
  }

  public newCollectionView<K extends string>(
    registrationId: K,
    options?: K extends keyof ClassMapTypeCollectionView
      ? ClassMapTypeCollectionView[K]['options']
      : CollectionViewOptions,
  ): Promise<
    K extends keyof ClassMapTypeCollectionView ? InstanceType<ClassMapTypeCollectionView[K]['classRef']> : never
  > {
    const collectionView = new TestCollectionView(options || {}, this);
    return Promise.resolve(
      collectionView as unknown as K extends keyof ClassMapTypeCollectionView
        ? InstanceType<ClassMapTypeCollectionView[K]['classRef']>
        : never,
    );
  }

  public getClassIds(type?: ClassCategory): Set<string> {
    return new Set<string>(['dummy-view', 'dummy-model', 'dummy-collection']);
  }

  public toggleClass(className: string, add?: boolean): this {
    return this;
  }

  public setLoadingState(show?: boolean): boolean {
    return false;
  }

  public loadViewStyles(view: View): this {
    return this;
  }
}
