"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAttachReference = isAttachReference;
const emitter_1 = __importDefault(require("./emitter"));
const emitter_2 = require("./imports/emitter");
const model_1 = __importDefault(require("./model"));
const element_1 = require("./util/element");
const error_1 = require("./util/error");
const string_1 = require("./util/string");
const template_1 = require("./util/template");
class View extends emitter_1.default {
    constructor(options = {}, app) {
        super({
            ...options,
            events: emitter_2.nativeEvents,
        }, app);
        this._viewId = (0, string_1.getUniqueId)();
        this.ui = {};
        this._ui = {};
        this.renderOptions = {};
        this.children = {};
        this.wasRendered = false;
        this.isRendered = new Promise((resolve) => {
            this.resolveIsRendered = resolve;
        });
        const tagName = this.renderOptions.tagName || this.constructor.tagName;
        this.el = (0, element_1.convertToRootElement)(document.createElement(tagName), this);
        if (this.options.id) {
            this.setViewId(this.options.id);
        }
        const asyncFuncs = [this.setModel(), this.initialize()];
        Promise.all(asyncFuncs).then(() => this.markAsReady());
    }
    async render() {
        if (this.isDestroyed)
            return Promise.reject(new Error('Component is destroyed'));
        await this.isReady;
        if (!this.compiledTemplate && this.template) {
            const templateContent = this.templateWrapper
                ? this.templateWrapper.replace('{{content}}', this.template)
                : this.template;
            this.compiledTemplate = (0, template_1.getCompiledTemplate)(templateContent);
        }
        if (this.wasRendered) {
            this.isRendered = new Promise((resolve) => (this.resolveIsRendered = resolve));
            this.off({ subscriber: this });
            this.el.innerHTML = '';
        }
        else {
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
        if (this.isDestroyed)
            return Promise.reject(new Error('Component is destroyed'));
        this.resolveIsRendered(this);
        return this;
    }
    async onRender() { }
    prepareRootElement() {
        let name = this.constructor.name;
        name = name.charAt(0) === '_' ? name.slice(1) : name;
        let attributesToSet = this.options.attributes || {};
        if (this.constructor.isRoute) {
            this.addClass('ui-route');
            attributesToSet.id = name;
        }
        else if (this.constructor.isComponent) {
            this.addClass('ui-component', `ui-component-${(0, string_1.toHyphenCase)(name)}`);
        }
        else {
            attributesToSet.id = name;
        }
        this.addClass(...(this.options.classNames || []));
        this.setAttributes(attributesToSet);
    }
    attachRootElement() {
        if (!this.options.attachTo)
            return;
        let attachTo = this.options.attachTo;
        let attachToElement;
        if (attachTo instanceof HTMLElement) {
            attachToElement = attachTo;
        }
        else if (attachTo instanceof NodeList) {
            attachToElement = attachTo[0];
        }
        else if (typeof attachTo === 'string') {
            attachToElement = this.el.querySelector(attachTo) || null;
        }
        else if (isAttachReference(attachTo)) {
            attachToElement = attachTo.view.getUiByIdSingle(attachTo.id);
        }
        if (attachToElement && attachToElement instanceof HTMLElement) {
            if (this.options.prepend) {
                this.prependTo(attachToElement);
            }
            else {
                this.appendTo(attachToElement);
            }
        }
        else {
            console.warn('Invalid attachTo reference:', attachTo);
        }
    }
    appendTo(el) {
        el.append(this.el);
    }
    prependTo(el) {
        el.prepend(this.el);
    }
    detach() {
        this.el.remove();
        return this.el;
    }
    addClass(...classNames) {
        const confirmedClassNames = classNames.filter((c) => !!c);
        if (confirmedClassNames.length > 0) {
            this.el.classList.add(...confirmedClassNames);
        }
        return this;
    }
    removeClass(...classNames) {
        const confirmedClassNames = classNames.filter((c) => !!c);
        if (confirmedClassNames.length > 0) {
            this.el.classList.remove(...confirmedClassNames);
        }
        return this;
    }
    removeClassByPrefix(prefix) {
        this.el.classList.forEach((value) => {
            if (value.startsWith(prefix)) {
                this.removeClass(value);
            }
        });
        return this;
    }
    swapClasses(classA, classB, condition) {
        this.toggleClass(classA, condition);
        this.toggleClass(classB, !condition);
    }
    toggleClass(className, force) {
        this.el.classList.toggle(className, force);
    }
    findChildEl(selector) {
        return this.el.querySelector(selector) || null;
    }
    getUiByIdSingle(id) {
        const els = this.getUiById(id);
        if (els) {
            return els[0];
        }
        return undefined;
    }
    getUiById(id) {
        const result = this._ui[id];
        if (result) {
            return result;
        }
        return undefined;
    }
    generateUiSelections(selectorAttribute = 'js') {
        this._ui = {};
        if (this.ui) {
            for (const [id, selector] of Object.entries(this.ui)) {
                const selection = this.el.querySelectorAll(`[data-${selectorAttribute}="${selector}"]`);
                if (selection.length > 0) {
                    this._ui[id] = selection;
                }
            }
        }
    }
    renderTemplate() {
        if (this.compiledTemplate && !this.isDestroyed) {
            this.el.innerHTML = this.compiledTemplate(this.getTemplateOptions());
            this.on('click', (ev) => {
                if (ev.defaultPrevented)
                    return;
                let target = ev.target;
                while (target && target !== this.el) {
                    if (target.tagName.toLowerCase() === 'a')
                        break;
                    target = target.parentElement;
                }
                if (!target || target.tagName.toLowerCase() !== 'a')
                    return;
                const anchor = target;
                const href = anchor.getAttribute('href');
                if (!href || href === '#')
                    return;
                ev.preventDefault();
                try {
                    const linkUrl = new URL(href, window.location.href);
                    const sameHost = linkUrl.hostname === window.location.hostname && linkUrl.port === (window.location.port || '');
                    if (sameHost) {
                        this.app.navigate(linkUrl.pathname + linkUrl.search + linkUrl.hash);
                    }
                    else {
                        const targetAttr = anchor.getAttribute('target') || '_self';
                        window.open(linkUrl.href, targetAttr);
                    }
                }
                catch (err) {
                    console.warn('Invalid link or error parsing URL:', href, err);
                }
            });
        }
    }
    getTemplateOptions(optionValues = {}) {
        return {
            id: this.getViewId(),
            ...(this.model ? { model: this.model.getAttributes() } : {}),
            ...(this.model ? { modelType: this.model.getType() } : {}),
            ...(this.model?.getCollection() ? { collection: this.model.getCollection()?.getVisibleAttributes() } : {}),
            ...this.options,
            ...optionValues,
        };
    }
    async newChild(registrationId, viewOptions) {
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
    getChildById(id) {
        const child = this.children[id];
        if (child)
            return child;
        return;
    }
    getChildByModelId(id) {
        return Object.values(this.children).find((child) => child.getId() === id);
    }
    destroyChildById(id) {
        const child = this.getChildById(id);
        if (child) {
            child.destroy();
            delete this.children[id];
        }
    }
    getViewId() {
        return this._viewId;
    }
    setViewId(str) {
        this._viewId = str;
    }
    getId() {
        return this.model?.getId() || undefined;
    }
    getModel() {
        return this.model;
    }
    async setModel() {
        if (!this.options.model) {
            return undefined;
        }
        if (this.options.model instanceof model_1.default) {
            this.model = this.options.model;
            return this.model;
        }
        if (typeof this.options.model === 'string') {
            this.model = await this.app.newModel(this.options.model);
            return this.model;
        }
        return undefined;
    }
    setAttributes(attributes) {
        if (!attributes) {
            return this;
        }
        for (const [name, value] of Object.entries(attributes)) {
            if (value == null) {
                this.el.removeAttribute(name);
                if (name.startsWith('data-')) {
                    const dataKey = name.slice(5);
                    delete this.el.dataset[dataKey];
                }
                continue;
            }
            try {
                this.el.setAttribute(name, value);
                if (name.startsWith('data-')) {
                    const dataKey = name.slice(5);
                    this.el.dataset[dataKey] = value;
                }
            }
            catch (error) {
                console.warn(`Unable to set attribute "${name}" with value "${value}".`, {
                    message: error.message,
                    name: error.name,
                    code: error.code,
                });
            }
        }
        return this;
    }
    setErrorState(msg, options = {}) {
        if (this.isDestroyed)
            return;
        this.removeErrorState();
        const errorElement = (0, error_1.errorTemplate)(msg);
        (options.attachTo || this.el).append(errorElement);
        this.errorEl = errorElement;
        this.addClass('is-error');
    }
    removeErrorState() {
        this.errorEl?.remove();
        this.errorEl = undefined;
        this.removeClass('is-error');
    }
    destroy() {
        if (this.isDestroyed)
            return;
        this.destroyChildren();
        super.destroy();
        this.model?.off({ subscriber: this });
        this.model = undefined;
        this.el?.remove();
        this.el = null;
        this.ui = {};
        this._ui = {};
        this.errorEl?.remove();
        this.errorEl = undefined;
        this.isRendered = undefined;
        this.options = {};
        this.compiledTemplate = undefined;
        this.template = undefined;
        this.templateWrapper = undefined;
        super.emit('destroyed');
    }
    destroyChildren() {
        Object.values(this.children).forEach((child) => child.destroy());
        this.children = {};
    }
}
View.tagName = 'div';
exports.default = View;
function isAttachReference(val) {
    return (val &&
        typeof val === 'object' &&
        'view' in val &&
        'id' in val &&
        val.view instanceof View &&
        typeof val.id === 'string');
}
//# sourceMappingURL=view.js.map