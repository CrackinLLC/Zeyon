import type { ClassMapTypeView } from './_maps';
import Emitter from './emitter';
import type { ZeyonAppLike } from './imports/app';
import { NativeEventArg } from './imports/emitter';
import { AttachReference, nativeEvents, RenderOptions, ViewOptions } from './imports/view';
import Model from './model';
import { convertToRootElement, RootElement } from './util/element';
import { ErrorStateOptions, errorTemplate } from './util/error';
import { getUniqueId, toHyphenCase } from './util/string';
import { getCompiledTemplate } from './util/template';

export default abstract class View extends Emitter {
  declare options: ViewOptions;
  declare defaultOptions: ViewOptions;

  static tagName = 'div';
  static isComponent: boolean = false;
  static template?: string;
  static templateWrapper?: string;
  static ui: { [key: string]: string } = {};
  static style: string | undefined;

  private _viewId: string = getUniqueId();
  protected el: RootElement;
  private _ui: { [key: string]: NodeListOf<HTMLElement> } = {};
  protected renderOptions: RenderOptions = {};

  protected children: { [id: string]: View } = {};
  protected model?: Model;

  public isRendered: Promise<this>;
  private resolveIsRendered!: (value: this) => void;
  protected hasBeenRendered: boolean = false;

  protected compiledTemplate?: HandlebarsTemplateDelegate;
  protected errorEl?: HTMLElement;

  constructor(options: ViewOptions = {}, app: ZeyonAppLike) {
    super(
      {
        ...options,
        events: nativeEvents,
      },
      app,
    );

    // Initialize promises for readiness and rendering
    this.isRendered = new Promise<this>((resolve) => {
      this.resolveIsRendered = resolve;
    });

    // Declare the unprocessed root element
    const tagName = this.renderOptions.tagName || (this.constructor as typeof View).tagName;
    this.el = convertToRootElement(document.createElement(tagName), this);

    // Override the generated id value if one was passed in
    if (this.options.id) {
      this.setViewId(this.options.id);
    }

    // Define our model and call the local initialize method before declaring the view ready.
    const asyncFuncs = [this.setModel(), this.initialize()];
    Promise.all(asyncFuncs).then(() => this.markAsReady());
  }

  /**
   * Renders the view by compiling templates, creating elements, and attaching to the DOM.
   * Can be called multiple times to re-render the view.
   */
  public async render(): Promise<this> {
    if (this.isDestroyed) return Promise.reject(new Error('Component is destroyed'));

    await this.isReady;

    const template: string = this.getStaticMember('template');
    const templateWrapper: string = this.getStaticMember('templateWrapper');

    if (!this.compiledTemplate && template) {
      const templateContent = templateWrapper ? templateWrapper.replace('{{content}}', template) : template;
      this.compiledTemplate = getCompiledTemplate(templateContent);
    }

    if (this.hasBeenRendered) {
      // Reset the view to prepare for re-rendering.
      // The root element has already been handled, in this case.
      this.isRendered = new Promise<this>((resolve) => (this.resolveIsRendered = resolve));
      this.off({ subscriber: this });
      this.el.innerHTML = '';
    } else {
      this.hasBeenRendered = true;
      this.prepareRootElement();
      this.attachRootElement();
    }

    this.renderTemplate();
    this.generateUiSelections();
    this.app.loadViewStyles(this);

    if (this.options.preventDefault) {
      this.on('click', (args: NativeEventArg) => args.ev.preventDefault());
    }

    await this.onRender();

    if (this.isDestroyed) return Promise.reject(new Error('Component is destroyed'));

    this.resolveIsRendered(this);
    return this;
  }

  /**
   * A hook called after rendering.
   * Subclasses can override this method to perform actions after the view is rendered.
   * Similar to the initialize method, but the method is assured that the template has
   * finished rendering and all ui members are available.
   */
  protected async onRender(): Promise<void> {}

  /**
   * Applies classnames and attributes to the root element based on the current options object.
   */
  protected prepareRootElement() {
    const name: string = this.getStaticMember('originalName');
    let attributesToSet = this.options.attributes || {};

    if ((this.constructor as any).isRoute) {
      this.addClass('ui-route');
      attributesToSet.id = name;
    } else if ((this.constructor as any).isComponent) {
      this.addClass('ui-component', `ui-component-${toHyphenCase(name)}`);
    } else {
      attributesToSet.id = name;
    }

    this.addClass(...(this.options.classNames || []));
    this.setAttributes(attributesToSet);
  }

  /**
   * Attaches the view's root element to the specified parent in the DOM.
   */
  protected attachRootElement() {
    if (!this.options.attachTo) return;
    let attachTo = this.options.attachTo;
    let attachToElement: HTMLElement | undefined;

    if (attachTo instanceof HTMLElement) {
      attachToElement = attachTo;
    } else if (attachTo instanceof NodeList) {
      attachToElement = attachTo[0];
    } else if (typeof attachTo === 'string') {
      attachToElement = (document.body.querySelector(attachTo) as HTMLElement) || null;
    } else if (isAttachReference(attachTo)) {
      attachToElement = attachTo.view.getUiByIdSingle(attachTo.id);
    }

    if (attachToElement && attachToElement instanceof HTMLElement) {
      if (this.options.prepend) {
        this.prependTo(attachToElement);
      } else {
        this.appendTo(attachToElement);
      }
    } else {
      console.warn('Invalid attachTo reference:', attachTo);
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

  addClass(...classNames: (string | undefined)[]) {
    const confirmedClassNames = classNames.filter((c): c is string => !!c);

    if (confirmedClassNames.length > 0) {
      this.el.classList.add(...confirmedClassNames);
    }

    return this;
  }

  removeClass(...classNames: (string | undefined)[]) {
    const confirmedClassNames = classNames.filter((c): c is string => !!c);

    if (confirmedClassNames.length > 0) {
      this.el.classList.remove(...confirmedClassNames);
    }

    return this;
  }

  removeClassByPrefix(prefix: string) {
    this.el.classList.forEach((value: string) => {
      if (value.startsWith(prefix)) {
        this.removeClass(value);
      }
    });

    return this;
  }

  swapClasses(classA: string, classB: string, condition: boolean) {
    this.toggleClass(classA, condition);
    this.toggleClass(classB, !condition);
  }

  toggleClass(className: string, force?: boolean) {
    this.el.classList.toggle(className, force);
  }

  findChildEl(selector: string): HTMLElement | null {
    return (this.el.querySelector(selector) as HTMLElement) || null;
  }

  getUiByIdSingle<T extends HTMLElement = HTMLElement>(id: string): T | undefined {
    const els = this.getUiById(id);

    if (els) {
      return els[0] as T;
    }

    return undefined;
  }

  getUiById<T extends HTMLElement = HTMLElement>(id: string): NodeListOf<T> | undefined {
    const result = this._ui[id];

    if (result) {
      return result as NodeListOf<T>;
    }

    return undefined;
  }

  /**
   * Populates the `_ui` property with DOM references based on selectors defined in `ui`.
   * @param {string} selectorAttribute - The data attribute to use for selecting UI elements.
   */
  protected generateUiSelections(selectorAttribute: string = 'js') {
    const ui: { [key: string]: string } = this.getStaticMember('ui');
    this._ui = {};

    // TODO: In order to retain our key but make our selection process unopinionated, we might want to store a static selector pattern from our decorator.

    if (ui) {
      for (const [id, selector] of Object.entries(ui)) {
        const selection = this.el.querySelectorAll(`[data-${selectorAttribute}="${selector}"]`);
        if (selection.length > 0) {
          this._ui[id] = selection as NodeListOf<HTMLElement>;
        }
      }
    }
  }

  protected renderTemplate() {
    if (this.compiledTemplate && !this.isDestroyed) {
      this.el.innerHTML = this.compiledTemplate(this.getTemplateOptions());

      this.on('click', (args: NativeEventArg) => {
        const { ev } = args;

        if (ev.defaultPrevented) return;

        let target = ev.target as HTMLElement | null;

        while (target && target !== this.el) {
          if (target.tagName.toLowerCase() === 'a') break;
          target = target.parentElement;
        }

        if (!target || target.tagName.toLowerCase() !== 'a') return;
        const anchor = target as HTMLAnchorElement;
        const href = anchor.getAttribute('href');

        if (!href || href === '#') return;
        ev.preventDefault(); // Intercept all anchor clicks

        try {
          const linkUrl = new URL(href, window.location.href);
          const sameHost =
            linkUrl.hostname === window.location.hostname && linkUrl.port === (window.location.port || '');

          if (sameHost) {
            // Local link => call app.navigate
            this.app.navigate(linkUrl.pathname + linkUrl.search + linkUrl.hash);
          } else {
            // External => open in same or new tab
            const targetAttr = anchor.getAttribute('target') || '_self';
            window.open(linkUrl.href, targetAttr);
          }
        } catch (err) {
          console.warn('Invalid link or error parsing URL:', href, err);
        }
      });
    }
  }

  protected getTemplateOptions(optionValues: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      id: this.getViewId(),
      ...(this.model ? { model: this.model.getAttributes() } : {}),
      ...(this.model ? { modelId: this.model.getRegistrationId() } : {}),
      ...(this.model?.getCollection() ? { collection: this.model.getCollection()?.getVisibleAttributes() } : {}),
      ...this.options,
      ...optionValues,
    };
  }

  public async newChild<K extends keyof ClassMapTypeView>(
    registrationId: K,
    viewOptions: ClassMapTypeView[K]['options'],
  ): Promise<InstanceType<ClassMapTypeView[K]['classRef']>> {
    if (this.isDestroyed) {
      return Promise.reject(new Error('Component is destroyed'));
    }

    return this.app.newView(registrationId, viewOptions).then((child) => {
      if (this.isDestroyed) {
        child.destroy();
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
      return undefined;
    }

    if (this.options.model instanceof Model) {
      this.model = this.options.model;
      return this.model;
    }

    if (typeof this.options.model === 'string') {
      this.model = await this.app.newModel(this.options.model);
      return this.model;
    }

    return undefined;
  }

  /**
   * Sets or removes attributes on the root element.
   * - Passing `null`/`undefined` removes the attribute.
   * - If an error occurs (e.g., invalid name), it logs a warning and continues.
   */
  public setAttributes(attributes?: Record<string, string | null | undefined>): this {
    if (!attributes) {
      return this;
    }

    for (const [name, value] of Object.entries(attributes)) {
      if (value == null) {
        this.el.removeAttribute(name);
        if (name.startsWith('data-')) {
          const dataKey = name.slice(5);
          delete (this.el.dataset as any)[dataKey];
        }
        continue;
      }

      try {
        this.el.setAttribute(name, value);
        if (name.startsWith('data-')) {
          const dataKey = name.slice(5);
          (this.el.dataset as any)[dataKey] = value;
        }
      } catch (error: any) {
        console.warn(`Unable to set attribute "${name}" with value "${value}".`, {
          message: error.message,
          name: error.name,
          code: (error as any).code,
        });
      }
    }

    return this;
  }

  /**
   * Displays an error message within the view.
   * @param {string} msg - The error message to display.
   * @param {ErrorStateOptions} options - Options for displaying the error.
   */
  setErrorState(msg: string, options: ErrorStateOptions = {}) {
    if (this.isDestroyed) return;

    this.removeErrorState();

    const errorElement = errorTemplate(msg);

    (options.attachTo || this.el).append(errorElement);
    this.errorEl = errorElement;

    this.addClass('is-error');
  }

  /**
   * Removes any displayed error messages.
   */
  protected removeErrorState() {
    this.errorEl?.remove();
    this.errorEl = undefined;
    this.removeClass('is-error');
  }

  protected isNativeEvent(eventName: string): boolean {
    // If we have this.el and the event is in the known DOM events list
    return !!this.el && nativeEvents.includes(eventName);
  }

  /**
   * Cleans up the view by removing event listeners, children and other references.
   */
  public destroy(silent: boolean = false): void {
    if (this.isDestroyed) return;
    super.destroy(silent);

    this.destroyChildren();
    this.model?.off({ subscriber: this });
    this.model = undefined;

    // Nullify properties
    this.el?.remove();
    // @ts-ignore - Cleaning up for purposes of destroying the class
    this.el = null;
    this._ui = {};
    this.errorEl?.remove();
    this.errorEl = undefined;
    // @ts-ignore - Cleaning up for purposes of destroying the class
    this.isRendered = undefined;
    // @ts-ignore - Cleaning up for purposes of destroying the class
    this.options = {};
    this.compiledTemplate = undefined;

    super.emit('destroyed');
  }

  /**
   * Cleans up all child views without affecting the current view.
   */
  public destroyChildren() {
    Object.values(this.children).forEach((child) => (child as View).destroy());
    this.children = {};
  }
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
