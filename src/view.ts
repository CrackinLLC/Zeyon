import Emitter from './emitter';
import type { ClassMapTypeView } from './generated/ClassMapType';
import { ZeyonAppLike } from './imports/app';
import { nativeEvents } from './imports/emitter';
import { AttachReference, RenderOptions, ViewOptions } from './imports/view';
import Model from './model';
import { convertToRootElement, RootElement } from './util/element';
import { ErrorStateOptions, errorTemplate } from './util/error';
import { getUniqueId, toHyphenCase } from './util/string';
import { getCompiledTemplate } from './util/template';

export default abstract class View extends Emitter {
  declare options: ViewOptions;
  declare defaultOptions: ViewOptions;

  static tagName = 'div';
  static isComponent: boolean;

  private _viewId: string = getUniqueId();
  protected el: RootElement;
  protected ui: { [key: string]: string } = {};
  private _ui: { [key: string]: NodeListOf<HTMLElement> } = {};
  protected renderOptions: RenderOptions = {};

  protected children: { [id: string]: View } = {};
  protected model?: Model;

  public isRendered: Promise<this>;
  private resolveIsRendered!: (value: this) => void;
  private wasRendered: boolean = false;

  protected compiledTemplate?: HandlebarsTemplateDelegate;
  protected template?: string;
  protected templateWrapper?: string;
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
    const funcs = [this.setModel().then((model) => (this.model = model)), this.initialize()];
    Promise.all(funcs).then(() => this.markAsReady());
  }

  /**
   * Renders the view by compiling templates, creating elements, and attaching to the DOM.
   * Can be called multiple times to re-render the view.
   */
  public async render(): Promise<this> {
    if (this.isDestroyed) return Promise.reject(new Error('Component is destroyed'));

    await this.isReady;

    if (!this.compiledTemplate && this.template) {
      const templateContent = this.templateWrapper
        ? this.templateWrapper.replace('{{content}}', this.template)
        : this.template;
      this.compiledTemplate = getCompiledTemplate(templateContent);
    }

    if (this.wasRendered) {
      // Reset the view to prepare for re-rendering.
      // The root element has already been handled, in this case.
      this.isRendered = new Promise<this>((resolve) => (this.resolveIsRendered = resolve));
      this.off({ subscriber: this });
      this.el.innerHTML = '';
    } else {
      this.wasRendered = true;
      this.prepareRootElement();
      this.attachRootElement();
    }

    this.renderTemplate();
    this.generateUiSelections();

    if (this.options.preventDefault) {
      this.on('click', (event) => event.preventDefault());
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
    let name = (this.constructor as any).name;
    name = name.charAt(0) === '_' ? name.slice(1) : name;

    if ((this.constructor as any).isRoute) {
      this.addClass('ui-route');
      this.setAttributes({ id: name });
    } else if ((this.constructor as any).isComponent) {
      this.addClass('ui-component', `ui-component-${toHyphenCase(name)}`);
    } else {
      this.setAttributes({ id: name });
    }

    this.addClass(...(this.options.classNames || []));
    this.setAttributes(this.options.attributes);
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
      attachToElement = (this.el.querySelector(attachTo) as HTMLElement) || null;
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
    this._ui = {};

    if (this.ui) {
      for (const [id, selector] of Object.entries(this.ui)) {
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

      // Intercept anchor tag clicks and handle them in the app
      this.on('click', (ev) => {
        // Ignore, if the event's default action has already been prevented
        if (ev.defaultPrevented) {
          return;
        }

        // Traverse up the DOM tree to find the nearest ancestor 'a' tag
        let targetElement = ev.target as HTMLElement | null;
        while (targetElement && targetElement !== this.el) {
          if (targetElement.tagName.toLowerCase() === 'a') break;
          targetElement = targetElement.parentElement;
        }

        if (targetElement && targetElement.tagName.toLowerCase() === 'a') {
          const anchor = targetElement as HTMLAnchorElement;
          const href = anchor.getAttribute('href');

          if (href && href !== '#') {
            console.log('We caught an anchor click and are handling it.');

            ev.preventDefault();
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
      ...(this.model?.getCollection() ? { collection: this.model.getCollection()?.getVisibleAttributes() } : {}),
      ...this.options,
      ...optionValues,
    };
  }

  async newChild<K extends keyof ClassMapTypeView>(
    registrationId: K,
    viewOptions: ClassMapTypeView[K]['options'],
  ): Promise<ClassMapTypeView[K]> {
    if (this.isDestroyed) {
      return Promise.reject(new Error('Component is destroyed'));
    }

    // Now call newInstance with registrationId
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
      return;
    } else if (this.options.model instanceof Model) {
      return this.options.model;
    }

    let model: Model | undefined;
    const attributes = this.options.model;

    if (typeof attributes === 'string') {
      model = await this.app.newModel(`model-${this.options.model}`);
    } else {
      const type = this.options.modelType;

      if (type) {
        if (Array.isArray(type)) {
          console.warn(`Ambiguous model type: ${type.join(', ')}. Please specify modelType in view options.`, this);
        } else {
          model = await this.app.newModel(`model-${type}`, {
            attributes,
          });
        }
      } else {
        console.warn(`Unknown model type. Please specify modelType in view options.`, this);
      }
    }

    return model;
  }

  /**
   * Sets or removes attributes on the root element.
   * @param attributes - A record of attribute names and their values. If the value is null or undefined, the attribute is removed.
   * @param options - Optional settings for attribute handling.
   */
  setAttributes(attributes?: Record<string, string | undefined | null>, options?: { dataPrefix?: boolean }) {
    if (!attributes) return this;

    const { dataPrefix = false } = options || {};

    for (const [name, value] of Object.entries(attributes)) {
      let attributeName = name;

      if (dataPrefix && !name.startsWith('data-') && !name.startsWith('aria-')) {
        attributeName = `data-${name}`;
      }

      if (value === null || value === undefined) {
        this.el.removeAttribute(attributeName);
        if (attributeName.startsWith('data-')) {
          const dataKey = attributeName.slice(5);
          delete (this.el.dataset as any)[dataKey];
        }
      } else {
        this.el.setAttribute(attributeName, value);
        if (attributeName.startsWith('data-')) {
          const dataKey = attributeName.slice(5);
          (this.el.dataset as any)[dataKey] = value;
        }
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

  /**
   * Cleans up the view by removing event listeners, children and other references.
   */
  public destroy(): void {
    if (this.isDestroyed) return;

    this.destroyChildren();
    super.destroy();

    this.model?.off({ subscriber: this });
    this.model = undefined;

    // Nullify properties
    this.el?.remove();
    // @ts-ignore - Cleaning up for purposes of destroying the view
    this.el = null;
    this.ui = {};
    this._ui = {};
    this.errorEl?.remove();
    this.errorEl = undefined;
    // @ts-ignore - Cleaning up for purposes of destroying the view
    this.isRendered = undefined;
    // @ts-ignore - Cleaning up for purposes of destroying the view
    this.options = {};
    this.compiledTemplate = undefined;
    this.template = undefined;
    // @ts-ignore - Cleaning up for purposes of destroying the view
    this.templateWrapper = undefined;

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
