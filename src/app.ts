import ClassRegistry from './classRegistry';
import type Emitter from './emitter';
import type {
  ClassMapKey,
  ClassMapTypeCollection,
  ClassMapTypeCollectionView,
  ClassMapTypeModel,
  ClassMapTypeRouteView,
  ClassMapTypeView,
} from './generated/ClassMapType';
import type { GlobalViewConfig, ZeyonAppLike, ZeyonAppOptions } from './imports/app';
import Router from './router';
import { loaderTemplate } from './util/loader';

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
   * A map of class definitions for dynamic instantiation.
   */
  private registry: ClassRegistry;

  /**
   * A stored loading state element for global loading state.
   */
  private loadingState: HTMLElement | null = null;

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

  public renderGlobalView(layouts: GlobalViewConfig | GlobalViewConfig[]) {
    if (!Array.isArray(layouts)) {
      layouts = [layouts];
    }

    layouts.forEach(({ selector, registrationId, options }) => {
      const element = document.querySelector(selector);

      if (element) {
        this.newView(registrationId, {
          ...(options || {}),
          attachTo: element as HTMLElement,
        }).then((view) => view?.render());
      } else {
        console.warn(`Element not found for selector: ${selector}`);
      }
    });

    return this;
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
   * @param urlFragment - The URL fragment to navigate to.
   * @param openNewTab - Whether to open the URL in a new tab.
   */
  public navigate(urlFragment: string, openNewTab = false): this {
    const baseUrl = new URL(document.baseURI);
    const url = new URL(urlFragment, baseUrl);

    if (url.origin !== baseUrl.origin || openNewTab) {
      window.open(url.href, '_blank');
    } else {
      this.router.navigate({ path: urlFragment });
    }

    return this;
  }

  public async newView<K extends keyof ClassMapTypeView>(
    registrationId: K,
    options?: ClassMapTypeView[K]['options'],
  ): Promise<InstanceType<ClassMapTypeView[K]['definition']>> {
    return this.newInstance<InstanceType<ClassMapTypeView[K]['definition']>>(registrationId, options);
  }

  public newRouteView<K extends keyof ClassMapTypeRouteView>(
    registrationId: K,
    options?: ClassMapTypeRouteView[K]['options'],
  ): Promise<InstanceType<ClassMapTypeRouteView[K]['definition']>> {
    return this.newInstance<InstanceType<ClassMapTypeRouteView[K]['definition']>>(registrationId, options);
  }

  public newModel<K extends keyof ClassMapTypeModel>(
    registrationId: K,
    options?: ClassMapTypeModel[K]['options'],
  ): Promise<InstanceType<ClassMapTypeModel[K]['definition']>> {
    return this.newInstance<InstanceType<ClassMapTypeModel[K]['definition']>>(registrationId, options);
  }

  public newCollection<K extends keyof ClassMapTypeCollection>(
    registrationId: K,
    options?: ClassMapTypeCollection[K]['options'],
  ): Promise<InstanceType<ClassMapTypeCollection[K]['definition']>> {
    return this.newInstance<InstanceType<ClassMapTypeCollection[K]['definition']>>(registrationId, options);
  }

  public newCollectionView<K extends keyof ClassMapTypeCollectionView>(
    registrationId: K,
    options?: ClassMapTypeCollectionView[K]['options'],
  ): Promise<InstanceType<ClassMapTypeCollectionView[K]['definition']>> {
    return this.newInstance<InstanceType<ClassMapTypeCollectionView[K]['definition']>>(registrationId, options);
  }

  private async newInstance<T extends Emitter>(registrationId: ClassMapKey, options?: unknown): Promise<T> {
    const def = await this.registry.getClass(registrationId);
    if (!def) throw new Error(`No class with id: ${registrationId}`);

    const instance = new def(options || {}, this) as T;
    if (instance.isReady instanceof Promise) {
      await instance.isReady;
    }

    // const typed = instance as T;
    // const checkIsReady: Promise<T> = typed.isReady;

    return instance;
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
}
