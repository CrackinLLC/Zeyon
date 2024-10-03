import type ApplicationCore from './app';
import Emitter from './emitter';
import { AttachReference, ErrorStateOptions, errorTemplate, RenderOptions, ViewOptions } from './imports/view';
import Model from './model';
import { convertToRootElement, RootElement } from './util/element';
import { getUniqueId, toHyphenCase } from './util/string';

export default abstract class View extends Emitter {
  static tagName = 'div';
  static isComponent: boolean;
  static isScreen: boolean;
  static defaultOptions: ViewOptions = {};

  declare el: RootElement;
  protected ui: { [key: string]: string } = {};
  protected errorEl?: HTMLElement;
  protected renderOptions: RenderOptions = {};

  private _viewId: string = getUniqueId();
  private _ui: { [key: string]: NodeListOf<HTMLElement> | HTMLElement } = {};

  protected children: { [id: string]: View } = {};
  protected model?: Model;
  public isReady?: Promise<this>;
  public isRendered?: Promise<this>;
  private resolveIsRendered!: (value: this) => void;
  protected isDestroyed: boolean = false;

  protected compiledTemplate?: HandlebarsTemplateDelegate;
  protected template?: string;
  protected templateOptions: string[] = [];
  protected templateWrapper?: string;
  protected templateWrapperOptions: string[] = [];

  readonly options: ViewOptions;

  constructor(options: ViewOptions = {}, protected app: ApplicationCore) {
    super({ customEvents: options.customEvents, includeNativeEvents: true });

    // Merge default options
    const defaultOptions = (this.constructor as typeof View).defaultOptions || {};
    this.options = { ...defaultOptions, ...options };

    // Initialize promises for readiness and rendering
    const { promise: isRenderedPromise, resolve: isRenderedResolve } = Promise.withResolvers<this>();
    this.isRendered = isRenderedPromise;
    this.resolveIsRendered = isRenderedResolve;

    if (this.options.id) {
      this.setViewId(this.options.id);
    }

    this.isReady = new Promise(async (resolve) => {
      await Promise.all([this.initialize(), this.setModel().then((model) => (this.model = model))]);
      resolve(this);
    });
  }

  /**
   * Initializes the view. Subclasses should override this method to perform asynchronous operations before rendering.
   */
  protected async initialize(): Promise<void> {}

  public async render(): Promise<this> {
    if (this.isDestroyed) {
      return Promise.reject(new Error('Component is destroyed'));
    }

    await this.isReady;

    if (!this.compiledTemplate && this.template) {
      const templateContent = this.templateWrapper
        ? this.templateWrapper.replace('{{content}}', this.template)
        : this.template;
      this.compiledTemplate = Handlebars.compile(templateContent);
    }

    const tagName = this.renderOptions.tagName || (this.constructor as typeof View).tagName;
    this.el = convertToRootElement(document.createElement(tagName), this);

    let name = (this.constructor as any).name;
    name = name.charAt(0) === '_' ? name.slice(1) : name;

    const isScreen = (this.constructor as any).isScreen;

    if (isScreen) {
      this.addClass('is-standard-screen');
    }
    if ((this.constructor as any).isComponent && !isScreen) {
      this.addClass(`component-${toHyphenCase(name)}`);
    } else {
      this.el.setAttribute('id', name);
    }

    this.addClass(...(this.options.classNames || []));
    this.setAttributes(this.options.attributes);

    this.renderTemplate();
    this.attachViewElement();
    this.generateUiSelections();

    if (this.options.preventDefault) {
      this.el.addEventListener('click', (event: MouseEvent) => event.preventDefault());
    }

    // Override render to handle re-rendering
    this.render = async () => {
      if (this.isDestroyed) return this;

      this.off({ listener: this });
      this.el.innerHTML = '';
      this.renderTemplate();
      this.generateUiSelections();
      await this.onRender();

      return this;
    };

    await this.onRender();

    if (this.isDestroyed) {
      return Promise.reject(new Error('Component is destroyed'));
    }

    this.resolveIsRendered(this);
    return this;
  }

  /**
   * Hook called after rendering. Subclasses can override this method to perform actions after the view is rendered.
   */
  protected async onRender(): Promise<void> {}

  setErrorState(msg: string, options: ErrorStateOptions = {}) {
    if (this.errorEl) {
      this.removeErrorState();
    }

    (options.attachTo || this.el).append((this.errorEl = errorTemplate(msg)));
    this.addClass('is-error');
  }

  protected removeErrorState() {
    this.errorEl?.remove();
    this.errorEl = undefined;
    this.removeClass('is-error');
  }

  attachViewElement() {
    if (!this.options.attachTo) return;
    let attachTo = this.options.attachTo;

    // We have an attachTo value that is something other than a DOM element
    if (!(attachTo instanceof HTMLElement)) {
      if (typeof attachTo === 'string') {
        attachTo = this.getElementBySelector(attachTo) || '';
      } else if (attachTo instanceof NodeList) {
        attachTo = attachTo[0];
      } else if (isAttachReference(attachTo)) {
        attachTo = attachTo.view.getSingleUiById(attachTo.id) || '';
      }
    }

    // Make sure our attempts to determine a valid element were successful
    if (attachTo && attachTo instanceof HTMLElement) {
      if (this.options.prepend) {
        attachTo.prepend(this.el);
      } else {
        attachTo.append(this.el);
      }
    }
  }

  appendTo(el: HTMLElement) {
    el.append(this.el);
  }

  prependTo(el: HTMLElement) {
    el.prepend(this.el);
  }

  detach(): HTMLElement {
    this.el.remove();
    return this.el;
  }

  getSingleUiById<T extends HTMLElement = HTMLElement>(id: string): T | undefined {
    const el = this._ui[id];

    if (el instanceof NodeList) {
      return el[0] as T;
    } else if (el) {
      return el as T;
    }

    return undefined;
  }

  getListUiById<T extends HTMLElement = HTMLElement>(id: string): NodeListOf<T> | undefined {
    const els = this._ui[id];

    if (els && els instanceof NodeList) {
      return els as NodeListOf<T>;
    }

    return undefined;
  }

  private getElementBySelector(selector: string): HTMLElement | null {
    return (this.el && this.el.querySelector(selector)) || null;
  }

  protected generateUiSelections(selectorAttribute: string = 'js') {
    if (this.ui) {
      Object.entries(this.ui).forEach(([id, selector]) => {
        const selection = this.el.querySelectorAll(`[data-${selectorAttribute}=${selector}]`);
        const isMultiSelect = selection.length > 1;

        if (selection.length > 0) {
          if (isMultiSelect) {
            this._ui[id] = selection as NodeListOf<HTMLElement>;
          } else {
            this._ui[id] = selection[0] as HTMLElement;
          }
        }
      });
    }
  }

  protected renderTemplate() {
    if (this.compiledTemplate && !this.isDestroyed) {
      this.el.innerHTML = this.compiledTemplate(this.getTemplateOptions());

      // Intercept anchor tag clicks and handle them in the app
      this.el.addEventListener('click', (event: MouseEvent) => {
        // Ignore, if the event's default action has already been prevented
        if (event.defaultPrevented) {
          return;
        }

        // Traverse up the DOM tree to find the nearest ancestor 'a' tag
        let targetElement = event.target as HTMLElement | null;
        while (targetElement && targetElement !== this.el) {
          if (targetElement.tagName.toLowerCase() === 'a') break;
          targetElement = targetElement.parentElement;
        }

        if (targetElement && targetElement.tagName.toLowerCase() === 'a') {
          const anchor = targetElement as HTMLAnchorElement;
          const href = anchor.getAttribute('href');

          if (href && href !== '#') {
            console.log('We caught an anchor click and are handling it.');

            event.preventDefault();
            this.app.navigate(href);
          }
        }
      });
    }
  }

  protected getTemplateOptions(optionValues: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      id: this.getViewId(),
      ...(this.model ? { model: this.model.getAttributes() } : {}),
      ...(this.model ? { modelType: this.model.getType() } : {}),
      ...this.options,
      ...optionValues,
    };
  }

  protected registerPartialTemplate(name: string, template: string) {
    Handlebars.registerPartial(name, template);
  }

  async newChild<V extends View>(id: string, viewOptions: V['options'], ...more: unknown[]): Promise<V> {
    if (this.isDestroyed) {
      return Promise.reject(new Error('Component is destroyed'));
    }

    return this.app.newInstance<V>(id, viewOptions, ...more).then((child) => {
      if (this.isDestroyed) {
        child.destroy(); // If our parent was destroyed while waiting to load the child
        return Promise.reject(new Error('Component is destroyed'));
      }

      child.render();
      this.children[child.getViewId()] = child;

      return child;
    });
  }

  getChildById<T extends View>(id: string): T | undefined {
    const child = this.children[id];

    if (child) return child as T;

    return;
  }

  getChildByModelId<T extends View>(id: number): T | undefined {
    return Object.values(this.children).find((child) => child.getId() === id) as T;
  }

  protected destroyChildById(id: string) {
    const child = this.getChildById(id);

    if (child) {
      child.destroy();
      delete this.children[id];
    }
  }

  // View ID is used for tracking views in the app, and should be unique strings
  getViewId(): string {
    return this._viewId;
  }

  protected setViewId(str: string) {
    this._viewId = str;
  }

  // Model ID is used for tracking models in the app, and corispond to record ids from the server
  getId(): number | undefined {
    return this.model?.getId() || undefined;
  }

  getModel(): Model | undefined {
    return this.model;
  }

  protected async setModel(): Promise<Model | undefined> {
    if (!this.options.model) {
      return;
    } else if (this.options.model instanceof Model) {
      return this.options.model;
    }

    let model: Model | undefined;
    const attributes = this.options.model;

    if (typeof attributes === 'string') {
      model = await this.app.newInstance<Model>(`model-${this.options.model}`);
    } else {
      const type = this.options.modelType;

      if (type) {
        if (Array.isArray(type)) {
          console.warn(`Ambiguous model type: ${type.join(', ')}. Please specify modelType in view options.`, this);
        } else {
          model = await this.app.newInstance<Model>(`model-${type}`, {
            attributes,
          });
        }
      } else {
        console.warn(`Unknown model type. Please specify modelType in view options.`, this);
      }
    }

    return model;
  }

  addClass(...classNames: (string | undefined)[]) {
    const confirmedClassNames = classNames.filter((c): c is string => !!c);

    if (confirmedClassNames.length > 0) {
      this.el.classList.add(...confirmedClassNames);
    }

    return this;
  }

  swapClasses(classA: string, classB: string, condition: boolean) {
    if (condition) {
      this.el.classList.add(classA);
      this.el.classList.remove(classB);
    } else {
      this.el.classList.add(classB);
      this.el.classList.remove(classA);
    }
  }

  setAttributes(attributes?: Record<string, string | undefined | null>) {
    if (!attributes) return;

    Object.entries(attributes).forEach(([name, value]) => {
      if (value === null) {
        //delete this.el.dataset[name];
        this.el.removeAttribute(name);
      } else {
        // this.el.dataset[name] = value || name;
        this.el.setAttribute(name, value || name);
      }
    });

    return this;
  }

  toggleClass(className: string, force?: boolean) {
    this.el.classList.toggle(className, force);
  }

  removeClass(...classNames: (string | undefined)[]) {
    const confirmedClassNames = classNames.filter((c): c is string => !!c);

    if (confirmedClassNames.length > 0) {
      this.el.classList.remove(...confirmedClassNames);
    }

    return this;
  }

  // Only applies to views that are defined as screens, but we haven't (yet?) defined a seperate class for them
  // Should be overridden by any class that needs to intercept navigation
  async beforeNavigate(newPath: string): Promise<boolean> {
    return !!newPath || true;
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    this.onDestroy();
    this.destroyChildren();

    this.model?.off({ listener: this });

    // Clean up UI elements
    Object.values(this._ui).forEach((el) => {
      if (el instanceof NodeList) {
        el.forEach((e) => e.remove());
      } else {
        el.remove();
      }
    });

    this.el?.remove();
    this.errorEl?.remove();

    // Nullify properties
    this.el = null!;
    this.ui = {};
    this._ui = {};
    this.errorEl = undefined;
    this.isReady = undefined;
    this.isRendered = undefined;
    this.model = undefined;
    // @ts-ignore - Cleaning up for purposes of destroying the view
    this.options = {};
    this.compiledTemplate = undefined;
    this.template = undefined;
    // @ts-ignore - Cleaning up for purposes of destroying the view
    this.templateOptions = undefined;
    this.templateWrapper = undefined;
    // @ts-ignore - Cleaning up for purposes of destroying the view
    this.templateWrapperOptions = undefined;

    this.off({ force: true });
    super.emit('destroyed');
  }

  destroyChildren() {
    Object.values(this.children).forEach((child) => (child as View).destroy());
    this.children = {};
  }

  onDestroy() {}
}

export function isAttachReference(val: any): val is AttachReference {
  return (
    val &&
    typeof val === 'object' &&
    'view' in val &&
    'id' in val &&
    val.view instanceof View && // Ensure 'view' is a View instance
    typeof val.id === 'string' // Ensure 'id' is a string
  );
}
