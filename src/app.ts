import '../util/polyfill';
import '../util/template';

import Emitter from './emitter';
import type { EmitterOptions } from './imports/emitter';
import { loaderTemplate } from './imports/view';
import type Router from './router';
import type { BinaryClass, BinaryClassDefinition } from './util/type';

declare global {
  interface Window {
    APP: ApplicationCore;
  }
}

export interface ApplicationOptions extends EmitterOptions {
  name?: string;
  router: Router;
  classMap: Map<string, BinaryClassDefinition>;
}

/**
 * The central hub of the application, managing interactions between components.
 */
export default class ApplicationCore extends Emitter {
  /**
   * Indicates whether the application has started.
   */
  public started = false;

  /**
   * Identifier for the current application running.
   */
  public name = '';

  /**
   * The application's router.
   */
  public router: Router;

  /**
   * A map of class definitions for dynamic instantiation.
   */
  private classMap: Map<string, BinaryClassDefinition>;

  /**
   * The main section element of the application.
   */
  private sectionElement: HTMLElement;

  /**
   * The body element's class list for global class manipulation.
   */
  private bodyClassList: DOMTokenList = document.body.classList;

  /**
   * The loading state element.
   */
  private loadingState: HTMLElement | null = null;

  /**
   * A promise that resolves when the application is ready.
   */
  public isReady: Promise<this>;

  /**
   * Initializes a new instance of the ApplicationCore class.
   * @param options - The application options.
   */
  constructor(public options: ApplicationOptions) {
    super({ customEvents: ['loaded:screen', 'loaded:section', 'click'] });

    const { name, router, classMap } = options;

    this.name = name || '';
    this.router = router;
    this.classMap = classMap;
    this.sectionElement = document.querySelector('#app') as HTMLElement;

    this.isReady = Promise.resolve(this);
  }

  /**
   * Initializes the application.
   * @returns The application instance.
   */
  public async initialize(): Promise<this> {
    await this.isReady;

    if (!this.started) {
      this.started = true;

      this.router.start(this);

      document.body.addEventListener('click', (ev) => this.emit('click', ev));
    }

    return this;
  }

  /**
   * Navigates to a specified URL fragment.
   * @param urlFragment - The URL fragment to navigate to.
   * @param openNewTab - Whether to open the URL in a new tab.
   */
  public navigate(urlFragment: string, openNewTab = false): void {
    const baseUrl = new URL(document.baseURI);
    const url = new URL(urlFragment, baseUrl);

    if (url.origin !== baseUrl.origin || openNewTab) {
      window.open(url.href, '_blank');
    } else {
      this.router.navigate({ path: urlFragment });
    }
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
    const def = this.classMap.get(id);

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
   * Toggles a global class on the body element.
   * @param className - The class name to toggle.
   * @param add - Whether to add or remove the class.
   * @returns The application instance.
   */
  public toggleGlobalClass(className: string, add?: boolean): this {
    this.bodyClassList.toggle(className, add);
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
      this.sectionElement.appendChild(this.loadingState);
    } else if (!show && this.loadingState) {
      this.loadingState.remove();
      this.loadingState = null;
    }

    return show;
  }
}
