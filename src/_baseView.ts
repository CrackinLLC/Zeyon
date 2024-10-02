import Handlebars from "handlebars"; // TODO: Research and Consider moving to Template7
import {
  AttachReference,
  BaseViewOptions,
  ErrorStateOptions,
  errorTemplate,
  LoaderMarkup,
  LoaderType,
  RenderOptions,
} from "../_imports/view";
import BaseModel from "./_baseModel";
import type ApplicationCore from "./app";
import Emitter from "./emitter";
// import { TipDirection } from "./tip/_imports/_baseTip";
// import type SimpleTip from "./tip/simple";
import { getAttributesType } from "../util/attributes";
import { convertToRootElement, RootElement } from "../util/element";
import { IconType } from "../util/icons";
import { getUniqueId, toHyphenCase } from "../util/string";

export default class BaseView extends Emitter {
  static tagName = "div";
  static binaryId: string; // TODO: Not needed until we move back into dynamic modular loading of classes
  static isComponent: boolean;
  static isScreen: boolean;

  declare el: RootElement;
  protected ui: { [key: string]: string } = {};
  protected errorEl: HTMLElement | undefined;
  protected renderOptions: RenderOptions = {};

  private _viewId: string = getUniqueId();
  private _ui: { [key: string]: NodeListOf<HTMLElement> | HTMLElement } = {};

  protected children: { [id: string]: BaseView } = {};
  model: BaseModel | undefined;
  isReady: Promise<BaseView>;
  isRendered: Promise<BaseView>;
  resolveIsRendered: (value: BaseView | PromiseLike<BaseView>) => void;
  isDestroyed: boolean = false;

  protected compiledTemplate: HandlebarsTemplateDelegate | undefined;
  protected template: string | undefined;
  protected templateOptions: string[] | undefined = [];
  protected templateWrapper: string | undefined; // Allows for a parent to wrap the template, for extending views. Will not render unless we have a template.
  protected templateWrapperOptions: string[] | undefined = [];

  constructor(
    public options: BaseViewOptions = {},
    protected app: ApplicationCore
  ) {
    super({ customEvents: options.customEvents, includeNativeEvents: true });

    // Store our resolver seperately so different extending views can resolve as approproate
    const { promise: isRenderedPromise, resolve: isRenderedResolve } =
      Promise.withResolvers<BaseView>();
    this.isRendered = isRenderedPromise;
    this.resolveIsRendered = isRenderedResolve;

    this.isReady = new Promise(async (resolve) => {
      if (this.options.id) {
        this.setViewId(this.options.id);
      }

      if (this.options.model) {
        this.model = await this.setModel();
      }

      return resolve(this);
    }).then(async () => {
      await this.initialize();
      return this;
    });
  }

  // Override this method in child views to conduct additional asyncronous processes before rendering begins
  async initialize(): Promise<void> {}

  async render(): Promise<BaseView> {
    if (this.isDestroyed) {
      return Promise.reject(new Error("Component is destroyed"));
    }

    await this.isReady;

    if (!this.compiledTemplate) {
      let template: HandlebarsTemplateDelegate | undefined;

      if (this.template) {
        if (!this.templateWrapper) {
          template = BaseView.getCompiledTemplate(this.template);
        } else {
          template = BaseView.getCompiledTemplate(
            this.templateWrapper.replace("{{content}}", this.template)
          );
        }
      }

      this.compiledTemplate = template;
    }

    this.el = convertToRootElement(
      document.createElement(
        this.renderOptions.tagName || this.getStaticProperty("tagName")
      ),
      this
    );
    let name = this.getStaticProperty("name");
    name = name.charAt(0) === "_" ? name.slice(1) : name;

    const isScreen = this.getStaticProperty("isScreen");

    if (isScreen) {
      this.addClass("is-standard-screen");
    }
    if (this.getStaticProperty("isComponent") && !isScreen) {
      this.addClass(`component-${toHyphenCase(name)}`);
    } else {
      this.el.setAttribute("id", name);
    }

    this.addClass(...(this.options.classNames || []));
    this.setAttributes(this.options.attributes);

    // These methods can be overridden for views that need special handling
    this.renderTemplate();
    this.attachViewElement();
    this.generateUiSelections();

    if (this.options.preventDefault) {
      this.el.addEventListener("click", (event: MouseEvent) =>
        event.preventDefault()
      );
    }

    // Handle subsequent re-renders of the view running only required processes
    // If child view is overwritting "render", this will overwrite that
    // Should always try and use an onRender method in extending views instead of render
    this.render = async () => {
      if (this.isDestroyed) return this;

      this.off({ listener: this });
      this.el.innerHTML = "";
      this.renderTemplate();
      this.generateUiSelections();
      await this.onRender();

      return this;
    };

    await this.onRender();

    if (this.isDestroyed) {
      // View can potentially be destroyed while awaiting onRender
      return Promise.reject(new Error("Component is destroyed"));
    }

    this.resolveIsRendered(this);
    return this;
  }

  protected async onRender() {}

  static getCompiledTemplate(template: string) {
    return Handlebars.compile(template);
  }

  setErrorState(msg: string, options: ErrorStateOptions = {}) {
    if (this.errorEl) {
      this.removeErrorState();
    }

    (options.attachTo || this.el).append((this.errorEl = errorTemplate(msg)));
    this.addClass("is-error");
  }

  protected removeErrorState() {
    this.errorEl?.remove();
    this.errorEl = undefined;
    this.removeClass("is-error");
  }

  attachViewElement() {
    if (!this.options.attachTo) return;
    let attachTo = this.options.attachTo;

    // We have an attachTo value that is something other than a DOM element
    if (!(attachTo instanceof HTMLElement)) {
      if (typeof attachTo === "string") {
        attachTo = this.getElementBySelector(attachTo) || "";
      } else if (attachTo instanceof NodeList) {
        attachTo = attachTo[0];
      } else if (isAttachReference(attachTo)) {
        attachTo = attachTo.view.getSingleUiById(attachTo.id) || "";
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

  getSingleUiById<T extends HTMLElement = HTMLElement>(
    id: string
  ): T | undefined {
    const el = this._ui[id];

    if (el instanceof NodeList) {
      return el[0] as T;
    } else if (el) {
      return el as T;
    }

    return undefined;
  }

  getListUiById<T extends HTMLElement = HTMLElement>(
    id: string
  ): NodeListOf<T> | undefined {
    const els = this._ui[id];

    if (els && els instanceof NodeList) {
      return els as NodeListOf<T>;
    }

    return undefined;
  }

  private getElementBySelector(selector: string): HTMLElement | null {
    return (this.el && this.el.querySelector(selector)) || null;
  }

  protected generateUiSelections(selectorAttribute: string = "js") {
    if (this.ui) {
      Object.entries(this.ui).forEach(([id, selector]) => {
        const selection = this.el.querySelectorAll(
          `[data-${selectorAttribute}=${selector}]`
        );
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
      this.el.innerHTML = this.compiledTemplate(
        this.getTemplateOptions([
          ...(this.templateWrapperOptions || []),
          ...(this.templateOptions || []),
        ])
      );

      // Intercept anchor tag clicks and handle them in the app
      this.el.addEventListener("click", (event: MouseEvent) => {
        // Ignore, if the event's default action has already been prevented
        if (event.defaultPrevented) {
          return;
        }

        // Traverse up the DOM tree to find the nearest ancestor 'a' tag
        let targetElement = event.target as HTMLElement | null;
        while (targetElement && targetElement !== this.el) {
          if (targetElement.tagName.toLowerCase() === "a") break;
          targetElement = targetElement.parentElement;
        }

        if (targetElement && targetElement.tagName.toLowerCase() === "a") {
          const anchor = targetElement as HTMLAnchorElement;
          const href = anchor.getAttribute("href");

          if (href && href !== "#") {
            console.log("We caught an anchor click and are handling it.");

            event.preventDefault();
            this.app.navigate(href);
          }
        }
      });

      this.isReady.then(() => {
        // Find tip attributes and initialize automatically
        const tipElements: HTMLElement[] = this.el.dataset.tip ? [this.el] : [];
        this.el.querySelectorAll("[data-tip]").forEach((el: HTMLElement) => {
          if (el.dataset.tip!.length > 0) tipElements.push(el);
        });

        tipElements.forEach((el) => {
          const content = el.dataset.tip || "";

          el.addEventListener("mouseenter", () => {
            if (el.dataset.tipDisabled) return;

            const directionMap = {
              top: TipDirection.Top,
              bottom: TipDirection.Bottom,
              left: TipDirection.Left,
              right: TipDirection.Right,
            };

            this.app.tipController.load<SimpleTip>("simple", {
              alignTo: el,
              direction:
                directionMap[el.dataset.tipDirection || ""] ||
                TipDirection.Bottom,
              message: content,
              // showDelay: 200, // TODO: Currently our tips are not handling showDelay well. Need to fix this.
              attachGap: 5,
              hideOnMouseOut: true,
            });
          });
        });
      });
    }
  }

  protected getTemplateOptions(templateOptionStrings: string[]) {
    const optionValues = {};

    templateOptionStrings.forEach((option: string) => {
      if (option === "model") {
        optionValues["model"] = this.model?.getAttributes();
      } else if (option === "collection") {
        optionValues["collection"] = {
          items: this["collection"]?.getVisibleAttributes(),
          type: this["collection"]?.getType(),
        };
      } else if (option === "id") {
        optionValues["id"] = this.getViewId();
      } else {
        optionValues[option] = this.options[option] || this[option];
      }
    });

    return optionValues;
  }

  protected registerPartialTemplate(name: string, template: string) {
    Handlebars.registerPartial(name, template);
  }

  async newChild<V extends BaseView>(
    id: string,
    viewOptions: V["options"],
    ...more: unknown[]
  ): Promise<V> {
    if (this.isDestroyed) {
      return Promise.reject(new Error("Component is destroyed"));
    }

    return this.app.newInstance<V>(id, viewOptions, ...more).then((child) => {
      if (this.isDestroyed) {
        child.destroy(); // If our parent was destroyed while waiting to load the child
        return Promise.reject(new Error("Component is destroyed"));
      }

      child.render();
      this.children[child.getViewId()] = child;

      return child;
    });
  }

  getChildById<T extends BaseView>(id: string): T | undefined {
    const child = this.children[id];

    if (child) return child as T;

    return;
  }

  getChildByModelId<T extends BaseView>(id: number): T | undefined {
    return Object.values(this.children).find(
      (child) => child.getId() === id
    ) as T;
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

  getModel(): BaseModel | undefined {
    return this.model;
  }

  protected async setModel(): Promise<BaseModel | undefined> {
    if (!this.options.model) {
      return;
    } else if (this.options.model instanceof BaseModel) {
      return this.options.model;
    }

    let model: BaseModel | undefined;
    const attributes = this.options.model;

    if (typeof attributes === "string") {
      model = await this.app.newInstance<BaseModel>(
        `model-${this.options.model}`
      );
    } else {
      const type = this.options.modelType || getAttributesType(attributes);

      if (type) {
        if (Array.isArray(type)) {
          console.warn(
            `Ambiguous model type: ${type.join(
              ", "
            )}. Please specify modelType in view options.`,
            this
          );
        } else {
          model = await this.app.newInstance<BaseModel>(`model-${type}`, {
            attributes,
          });
        }
      } else {
        console.warn(
          `Unknown model type. Please specify modelType in view options.`,
          this
        );
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

  getStaticProperty(property: string) {
    return this.constructor[property];
  }

  // Only applies to views that are defined as screens, but we haven't (yet?) defined a seperate class for them
  // Should be overridden by any class that needs to intercept navigation
  async beforeNavigate(newPath: string): Promise<boolean> {
    return !!newPath || true;
  }

  destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    this.onDestroy();
    this.destroyChildren();

    if (this.model) {
      this.model.off({ listener: this });
    }

    // Remove event listeners attached directly to the newEl
    // TODO: This isn't working, and is instead leaving clones in the dom
    // this.el.replaceWith(this.el.cloneNode(false) as HTMLElement);
    for (const el of Object.values(this._ui)) {
      if (el instanceof NodeList) {
        el.forEach((e) => e.remove());
      } else {
        el.remove();
      }
    }

    this.el && this.el["destroy"]();
    this.errorEl?.remove();

    // @ts-ignore: Inentionally removing properties for clean up, but normally this is not allowed
    delete this.el;
    // @ts-ignore
    delete this.ui;
    // @ts-ignore
    delete this._ui;
    delete this.errorEl;
    // @ts-ignore
    delete this.isReady;
    // @ts-ignore
    delete this.resolveIsReady;
    // @ts-ignore
    delete this.isRendered;
    // @ts-ignore
    delete this.resolveIsRendered;
    // Note: When should we destroy the model here?
    delete this.model;
    // @ts-ignore
    delete this.options;
    delete this.compiledTemplate;
    delete this.template;
    delete this.templateOptions;
    delete this.templateWrapper;
    delete this.templateWrapperOptions;

    super.destroyEvents();
    super.emit("destroyed");
  }

  destroyChildren() {
    Object.values(this.children).forEach((child) =>
      (child as BaseView).destroy()
    );
    this.children = {};
  }

  onDestroy() {}
}

Handlebars.registerHelper("eq", function (a, b) {
  return a === b;
});

Handlebars.registerHelper(
  "ifCond",
  function (v1: number, operator: string, v2: number, options: any) {
    switch (operator) {
      case "==":
        return v1 == v2 ? options.fn(this) : options.inverse(this);
      case "===":
        return v1 === v2 ? options.fn(this) : options.inverse(this);
      case "!=":
        return v1 != v2 ? options.fn(this) : options.inverse(this);
      case "!==":
        return v1 !== v2 ? options.fn(this) : options.inverse(this);
      case "<":
        return v1 < v2 ? options.fn(this) : options.inverse(this);
      case "<=":
        return v1 <= v2 ? options.fn(this) : options.inverse(this);
      case ">":
        return v1 > v2 ? options.fn(this) : options.inverse(this);
      case ">=":
        return v1 >= v2 ? options.fn(this) : options.inverse(this);
      case "&&":
        return v1 && v2 ? options.fn(this) : options.inverse(this);
      case "||":
        return v1 || v2 ? options.fn(this) : options.inverse(this);
      default:
        return options.inverse(this);
    }
  }
);

Handlebars.registerHelper("any", function (...args) {
  // The last argument is a Handlebars options object
  const actualArgs = args.slice(0, -1);

  // Return true if any argument is truthy
  return actualArgs.some((arg) => Boolean(arg));
});

Handlebars.registerHelper("all", function (...args) {
  // The last argument is a Handlebars options object
  const actualArgs = args.slice(0, -1);

  // Return true if all arguments are truthy
  return actualArgs.every((arg) => Boolean(arg));
});

Handlebars.registerHelper("ifOr", function (value1, value2) {
  return value1 || value2;
});

Handlebars.registerHelper("log", function (...args) {
  console.log(...args);
});

Handlebars.registerHelper(
  "math",
  function (lvalue: number, operator: string, rvalue: number) {
    return {
      "+": lvalue + rvalue,
      "-": lvalue - rvalue,
      "*": lvalue * rvalue,
      "/": lvalue / rvalue,
      "%": lvalue % rvalue,
    }[operator];
  }
);

Handlebars.registerHelper(
  "getIcon",
  function (icon: IconType, classes: string, style: string) {
    const styles = ["solid", "regular"];
    const list = ["icon", `fa-${icon}`];

    if (typeof classes === "string") {
      list.push(...classes.split(" "));
    }

    if (typeof style === "string" && styles.includes(style)) {
      list.push(`fa-${style}`);
    } else {
      list.push(`fa-solid`);
    }

    return new Handlebars.SafeString(
      icon ? `<i class="${list.join(" ")}"></i>` : ""
    );
  }
);

Handlebars.registerHelper(
  "getLoader",
  function (loader: LoaderType, classes?: string) {
    const list = ["loader", loader];

    if (classes && typeof classes === "string") {
      list.push(...classes.split(" "));
    }

    return new Handlebars.SafeString(
      loader
        ? `<span class="${list.join(" ")}" aria-hidden="true">${
            LoaderMarkup[loader]
          }</span>`
        : ""
    );
  }
);

export function isAttachReference(val: any): val is AttachReference {
  return (
    val &&
    typeof val === "object" &&
    "view" in val &&
    "id" in val &&
    val.view instanceof BaseView && // Ensure 'view' is a BaseView instance
    typeof val.id === "string" // Ensure 'id' is a string
  );
}
