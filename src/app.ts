import type {
  ClassMapKey,
  ClassMapTypeCollection,
  ClassMapTypeCollectionView,
  ClassMapTypeModel,
  ClassMapTypeRouteView,
  ClassMapTypeView,
} from 'zeyon/_maps';
import ClassRegistry, { ClassCategory } from './classRegistry';
import type Emitter from './emitter';
import type { ZeyonAppLike, ZeyonAppOptions } from './imports/app';
import { NavigateOptions } from './imports/router';
import type { RouteViewOptions } from './imports/routeView';
import type { ViewOptions } from './imports/view';
import Router from './router';
import { loaderTemplate } from './util/loader';
import type View from './view';

/**
 * The central hub of the application, managing interactions between components.
 */
export default class ZeyonApp implements ZeyonAppLike {
  /**
   * Custom identifying string for the current application.
   */
  public name = '';

  /**
   * Root element for the application
   */
  public el: HTMLElement;

  /**
   * Indicates whether the application has started. Prevents application from being initialized multiple times.
   */
  public isStarted = false;

  /**
   * Promise that resolves once the application has been started and is ready
   */
  public isReady: Promise<this>;
  private resolveIsReady!: (value: this) => void;

  /**
   * A global reference for our window object to prevent window duplication
   */
  public window: Window;

  /**
   * The application's router.
   */
  private router: Router;

  /**
   * A map of classRef keyed by registrationId, for dynamic instantiation.
   */
  private registry: ClassRegistry;

  /**
   * A stored loading state element for global loading state.
   */
  private loadingState: HTMLElement | null = null;

  private stylesLoaded = new Set<string>();

  /**
   * Initializes a new instance of the ZeyonApp.
   * @param options - The application options.
   */
  constructor(public options: ZeyonAppOptions) {
    const { name, el, urlPrefix, routes } = options;

    // Initialize readiness promises
    this.isReady = new Promise<this>((resolve) => {
      this.resolveIsReady = resolve;
    });

    this.name = name || '';
    this.el = el;
    this.window = window;

    this.router = new Router({ urlPrefix, routes }, this);
    this.registry = new ClassRegistry({}, this);
  }

  /**
   * Starts the router which loads the first route into the DOM
   * @returns The application instance.
   */
  public async start(): Promise<this> {
    if (!this.isStarted) {
      this.isStarted = true;

      this.router.start();
      this.resolveIsReady(this);
    }

    return this;
  }

  /**
   * Navigates to a specified URL fragment.
   * @param path - The URL to navigate to.
   * @param options
   */
  public navigate(path: string, options: NavigateOptions = {}): this {
    const baseUrl = new URL(document.baseURI);
    const url = new URL(path, baseUrl);

    if (url.origin !== baseUrl.origin || options.newTab) {
      window.open(url.href, '_blank');
    } else {
      this.router.navigate({
        ...options,
        route: path,
      });
    }

    return this;
  }

  public newView<K extends string>(
    registrationId: K,
    options?: K extends keyof ClassMapTypeView ? ClassMapTypeView[K]['options'] : ViewOptions,
  ): Promise<K extends keyof ClassMapTypeView ? InstanceType<ClassMapTypeView[K]['classRef']> : never> {
    const isViewKey = (key: string): key is string & keyof ClassMapTypeView => {
      return !this.getClassIds('View').has(registrationId);
    };

    if (isViewKey(registrationId)) {
      throw new Error(`Unknown VIEW ID: ${registrationId}`);
    }

    type ViewType = K extends keyof ClassMapTypeView ? InstanceType<ClassMapTypeView[K]['classRef']> : never;
    return this.newInstance<ViewType>(registrationId, options);
  }

  // Similar to newView, but renders the view and returns the application, rather than the unrendered view instance
  public async renderNewView<K extends string>(
    registrationId: K,
    options?: K extends keyof ClassMapTypeView ? ClassMapTypeView[K]['options'] : ViewOptions,
  ): Promise<this> {
    const view = await this.newView(registrationId, options);
    (view as View).render();
    return this;
  }

  public async newRouteView<K extends string>(
    registrationId: K,
    options?: K extends keyof ClassMapTypeRouteView ? ClassMapTypeRouteView[K]['options'] : RouteViewOptions,
  ): Promise<K extends keyof ClassMapTypeRouteView ? InstanceType<ClassMapTypeRouteView[K]['classRef']> : never> {
    const isRouteViewKey = (key: string): key is string & keyof ClassMapTypeRouteView => {
      return !this.getClassIds('RouteView').has(registrationId);
    };

    if (isRouteViewKey(registrationId)) {
      throw new Error(`Unknown ROUTEVIEW ID: ${registrationId}`);
    }

    type RouteViewType = K extends keyof ClassMapTypeRouteView
      ? InstanceType<ClassMapTypeRouteView[K]['classRef']>
      : never;

    return this.newInstance<RouteViewType>(registrationId, options);
  }

  public newModel<K extends string>(
    registrationId: K,
    options?: K extends keyof ClassMapTypeModel ? ClassMapTypeModel[K]['options'] : ViewOptions,
  ): Promise<K extends keyof ClassMapTypeModel ? InstanceType<ClassMapTypeModel[K]['classRef']> : never> {
    const isModelKey = (key: string): key is string & keyof ClassMapTypeModel => {
      return !this.getClassIds('Model').has(registrationId);
    };

    if (isModelKey(registrationId)) {
      throw new Error(`Unknown MODEL ID: ${registrationId}`);
    }

    type ModelType = K extends keyof ClassMapTypeModel ? InstanceType<ClassMapTypeModel[K]['classRef']> : never;
    return this.newInstance<ModelType>(registrationId, options);
  }

  public newCollection<K extends string>(
    registrationId: K,
    options?: K extends keyof ClassMapTypeCollection ? ClassMapTypeCollection[K]['options'] : ViewOptions,
  ): Promise<K extends keyof ClassMapTypeCollection ? InstanceType<ClassMapTypeCollection[K]['classRef']> : never> {
    const isCollectionKey = (key: string): key is string & keyof ClassMapTypeCollection => {
      return !this.getClassIds('Collection').has(registrationId);
    };

    if (isCollectionKey(registrationId)) {
      throw new Error(`Unknown COLLECTION ID: ${registrationId}`);
    }

    type CollectionType = K extends keyof ClassMapTypeCollection
      ? InstanceType<ClassMapTypeCollection[K]['classRef']>
      : never;
    return this.newInstance<CollectionType>(registrationId, options);
  }

  public newCollectionView<K extends string>(
    registrationId: K,
    options?: K extends keyof ClassMapTypeCollectionView ? ClassMapTypeCollectionView[K]['options'] : ViewOptions,
  ): Promise<
    K extends keyof ClassMapTypeCollectionView ? InstanceType<ClassMapTypeCollectionView[K]['classRef']> : never
  > {
    const isCollectionViewKey = (key: string): key is string & keyof ClassMapTypeCollectionView => {
      return !this.getClassIds('Collection').has(registrationId);
    };

    if (isCollectionViewKey(registrationId)) {
      throw new Error(`Unknown COLLECTION ID: ${registrationId}`);
    }

    type CollectionViewType = K extends keyof ClassMapTypeCollectionView
      ? InstanceType<ClassMapTypeCollectionView[K]['classRef']>
      : never;
    return this.newInstance<CollectionViewType>(registrationId, options);
  }

  private async newInstance<T>(registrationId: ClassMapKey, options?: unknown): Promise<T> {
    const def = await this.registry.getClass(registrationId);
    if (!def) throw new Error(`No class with id: ${registrationId}`);

    const instance = new def(options || {}, this) as T;
    if ((instance as Emitter).isReady instanceof Promise) {
      await (instance as Emitter).isReady;
    }

    return instance;
  }

  /**
   * Get a set that includes registration ids of all potential classes
   * @returns
   */
  public getClassIds(type?: ClassCategory): Set<string> {
    return this.registry.getClassIds(type);
  }

  /**
   * Toggles a classname on the root element.
   * @param className - The class name to toggle.
   * @param add - Whether to force add / remove the class.
   * @returns The application instance.
   */
  public toggleClass(className: string, add?: boolean): this {
    this.el.classList.toggle(className, add);
    return this;
  }

  /**
   * Sets or toggles the loading state of the application.
   * @param show - Whether to show or hide the loading state.
   * @returns The current loading state.
   */
  public setLoadingState(show?: boolean): boolean {
    if (typeof show !== 'boolean') {
      show = !this.loadingState;
    }

    if (show && !this.loadingState) {
      this.loadingState = loaderTemplate({ wrapped: true });
      this.el.appendChild(this.loadingState);
    } else if (!show && this.loadingState) {
      this.loadingState.remove();
      this.loadingState = null;
    }

    return show;
  }

  public loadViewStyles(view: View): this {
    const id: string = view.getStaticMember('registrationId');
    const styles: string = view.getStaticMember('styles');

    // TODO: Incorporate automatic style scoping at this point?

    if (styles && id && !this.stylesLoaded.has(id)) {
      const styleEl = document.createElement('style');
      styleEl.dataset.id = id;
      styleEl.innerHTML = styles;
      document.head.appendChild(styleEl);
      this.stylesLoaded.add(id);
    }

    return this;
  }
}
