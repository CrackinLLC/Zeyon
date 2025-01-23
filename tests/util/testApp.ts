import type {
  ClassMapTypeCollection,
  ClassMapTypeCollectionView,
  ClassMapTypeModel,
  ClassMapTypeRouteView,
  ClassMapTypeView,
} from '../../src/_index.d';
import type { GlobalViewConfig, ZeyonAppLike, ZeyonAppOptions } from '../../src/imports/app';
import type Router from '../../src/router';
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
  ): Promise<InstanceType<ClassMapTypeView[K]['definition']>> {
    const view = new TestView(options || {}, this);
    // view.registrationId = registrationId;

    return view as InstanceType<ClassMapTypeView[K]['definition']>;
  }

  public async newRouteView<K extends keyof ClassMapTypeRouteView>(
    registrationId: K,
    options?: ClassMapTypeRouteView[K]['options'],
  ): Promise<InstanceType<ClassMapTypeRouteView[K]['definition']>> {
    const routeView = new TestRouteView(options || {}, this);
    // routeView.registrationId = registrationId;

    return routeView as InstanceType<ClassMapTypeRouteView[K]['definition']>;
  }

  public async newModel<K extends keyof ClassMapTypeModel>(
    registrationId: K,
    options?: ClassMapTypeModel[K]['options'],
  ): Promise<InstanceType<ClassMapTypeModel[K]['definition']>> {
    const model = new TestModel(options || {}, this);
    // model.registrationId = registrationId;

    return model as InstanceType<ClassMapTypeModel[K]['definition']>;
  }

  public async newCollection<K extends keyof ClassMapTypeCollection>(
    registrationId: K,
    options?: ClassMapTypeCollection[K]['options'],
  ): Promise<InstanceType<ClassMapTypeCollection[K]['definition']>> {
    const collection = new TestCollection(options || {}, this);
    // collection.registrationId = registrationId;

    return collection as InstanceType<ClassMapTypeCollection[K]['definition']>;
  }

  public async newCollectionView<K extends keyof ClassMapTypeCollectionView>(
    registrationId: K,
    options?: ClassMapTypeCollectionView[K]['options'],
  ): Promise<InstanceType<ClassMapTypeCollectionView[K]['definition']>> {
    const collectionView = new TestCollectionView(options || {}, this);
    // collectionView.registrationId = registrationId;

    return collectionView as InstanceType<ClassMapTypeCollectionView[K]['definition']>;
  }

  public toggleClass(className: string, add?: boolean): this {
    return this;
  }

  public setLoadingState(show?: boolean): boolean {
    return false;
  }
}
