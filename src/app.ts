import '../util/polyfill';
import '../util/template';

import ClassRegistry from './classRegistry';
import type { RouteConfig } from './imports/router';
import { loaderTemplate } from './imports/view';
import Router from './router';
import type { BinaryClass, BinaryClassDefinition } from './util/type';

export interface HarnessAppOptions<CustomRouteProps = any> {
  name?: string;
  el: HTMLElement;
  urlPrefix: string;
  routes: RouteConfig<CustomRouteProps>[];
  registryClassList: Record<string, BinaryClassDefinition>;
}

/**
 * The central hub of the application, managing interactions between components.
 */
export default class HarnessApp<CustomRouteProps = any> {
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
   * A global loading state element.
   */
  private loadingState: HTMLElement | null = null;

  /**
   * Initializes a new instance of the HarnessApp class.
   * @param options - The application options.
   */
  constructor(public options: HarnessAppOptions) {
    const { name, el, urlPrefix, routes, registryClassList } = options;

    this.name = name || '';
    this.el = el;
    this.window = window;

    this.router = new Router<CustomRouteProps>({ routes, urlPrefix }, this);
    this.registry = new ClassRegistry({ registryClassList }, this);
  }

  /**
   * Starts the router which loads the first route into the DOM
   * @returns The application instance.
   */
  public async start(): Promise<this> {
    if (!this.isStarted) {
      this.isStarted = true;
      this.router.start();
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

  /**
   * Instantiates a new class by its identifier.
   * @param id - The class identifier.
   * @param options - The options for the class instance.
   * @param more - Additional arguments.
   * @returns The instantiated class.
   */
  public async newInstance<B extends BinaryClass>(
    id: string,
    options: B['options'] = {},
    ...more: unknown[]
  ): Promise<B> {
    const def = this.registry.getClass(id);

    if (!def) {
      const errorMessage = `Failed to locate class with id "${id}".`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      const instance = new def(options, this, ...more) as B;
      if (instance.isReady instanceof Promise) {
        await instance.isReady;
      }
      return instance;
    } catch (e) {
      console.error(`Failed to instantiate class with id "${id}".`, e);
      throw e;
    }
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
