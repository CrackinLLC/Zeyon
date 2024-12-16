import ClassRegistry from './classRegistry';
import type Collection from './collection';
import type CollectionView from './collectionView';
import type Emitter from './emitter';
import type { ClassMapType } from './generated/ClassMapType';
import type { GlobalViewConfig, ZeyonAppOptions } from './imports/app';
import type { Attributes } from './imports/model';
import { RouteConfig } from './imports/router';
import type Model from './model';
import Router from './router';
import type RouteView from './routeView';
import { loaderTemplate } from './util/loader';
import type View from './view';

/**
 * The central hub of the application, managing interactions between components.
 */
export default class ZeyonApp<CustomRouteProps = any> {
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
   * The application's router.
   */
  public router: Router;

  /**
   * A global reference for our window object to prevent window duplication
   */
  public window: Window;

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
    const { name, el, urlPrefix } = options;

    // Initialize readiness promises
    this.isReady = new Promise<this>((resolve) => {
      this.resolveIsReady = resolve;
    });

    this.name = name || '';
    this.el = el;
    this.window = window;

    this.router = new Router<CustomRouteProps>({ urlPrefix }, this);
    this.registry = new ClassRegistry({}, this);
  }

  public registerRoutes<C extends CustomRouteProps>(routes: RouteConfig<C>[]) {
    // TODO: Register routes with our registry

    this.router.registerRoutes(routes);
    return this;
  }

  public setGlobalViews(layouts: GlobalViewConfig[]) {
    layouts.forEach(({ selector, registrationId, options }) => {
      const element = document.querySelector(selector);

      if (element) {
        this.newView(registrationId, {
          ...(options || {}),
          attachTo: element,
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

  public async newView<K extends keyof ClassMapType>(
    registrationId: K,
    options?: any, // ClassMapType[K]['options'], -- TODO: Fix so that we can determine correct options interface from registrationId K
  ): Promise<ClassMapType[K] & View> {
    const instance = await this.newInstance<keyof ClassMapType, View>(registrationId, options);

    return instance as ClassMapType[K] & View;
  }

  public async newRouteView<K extends keyof ClassMapType>(
    registrationId: K,
    options?: any, // ClassMapType[K]['options'], -- TODO: Fix so that we can determine correct options interface from registrationId K
  ): Promise<ClassMapType[K] & RouteView> {
    const instance = await this.newInstance<keyof ClassMapType, RouteView>(registrationId, options);

    return instance as ClassMapType[K] & RouteView;
  }

  public async newModel<K extends keyof ClassMapType>(
    registrationId: K,
    options?: any, // ClassMapType[K]['options'], -- TODO: Fix so that we can determine correct options interface from registrationId K
  ): Promise<ClassMapType[K] & Model<Attributes>> {
    const instance = await this.newInstance<keyof ClassMapType, Model<Attributes>>(registrationId, options);

    return instance as ClassMapType[K] & Model<Attributes>;
  }

  public async newCollection<K extends keyof ClassMapType>(
    registrationId: K,
    options?: any, // ClassMapType[K]['options'], -- TODO: Fix so that we can determine correct options interface from registrationId K
  ): Promise<ClassMapType[K] & Collection<Attributes, Model<Attributes>>> {
    const instance = await this.newInstance<keyof ClassMapType, Collection<Attributes, Model<Attributes>>>(
      registrationId,
      options,
    );

    return instance as ClassMapType[K] & Collection<Attributes, Model<Attributes>>;
  }

  public async newCollectionView<K extends keyof ClassMapType>(
    registrationId: K,
    options?: any, // ClassMapType[K]['options'], -- TODO: Fix so that we can determine correct options interface from registrationId K
  ): Promise<ClassMapType[K] & CollectionView> {
    const instance = await this.newInstance<keyof ClassMapType, CollectionView>(registrationId, options);

    return instance as ClassMapType[K] & CollectionView;
  }

  private async newInstance<K extends keyof ClassMapType, T extends Emitter = Emitter>(
    registrationId: K,
    options?: any, // ClassMapType[K]['options'], -- TODO: Fix so that we can determine correct options interface from registrationId K
  ): Promise<T> {
    const def = await this.registry.getClass(registrationId);

    if (!def) {
      const errorMessage = `Failed to locate class with id "${registrationId}".`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    const instance = new def(options || {}, this);

    if (instance.isReady instanceof Promise) {
      await instance.isReady;
    }

    return instance as T; // Properly inferred as ClassMapType[K]
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
