import Emitter from './emitter';
import Model from './model';
import { convertToRootElement } from './util/element';
import { errorTemplate } from './util/error';
import { getUniqueId, toHyphenCase } from './util/string';
import { getCompiledTemplate } from './util/template';
class View extends Emitter {
    constructor(options = {}, app) {
        super({ events: options.events, includeNativeEvents: true, ...options }, app);
        this._viewId = getUniqueId();
        this.ui = {};
        this._ui = {};
        this.renderOptions = {};
        this.children = {};
        this.wasRendered = false;
        this.isRendered = new Promise((resolve) => {
            this.resolveIsRendered = resolve;
        });
        const tagName = this.renderOptions.tagName || this.constructor.tagName;
        this.el = convertToRootElement(document.createElement(tagName), this);
        if (this.options.id) {
            this.setViewId(this.options.id);
        }
        const funcs = [this.setModel().then((model) => (this.model = model)), this.initialize()];
        Promise.all(funcs).then(() => this.markAsReady());
    }
    async render() {
        if (this.isDestroyed)
            return Promise.reject(new Error('Component is destroyed'));
        await this.isReady;
        if (!this.compiledTemplate && this.template) {
            const templateContent = this.templateWrapper
                ? this.templateWrapper.replace('{{content}}', this.template)
                : this.template;
            this.compiledTemplate = getCompiledTemplate(templateContent);
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
        if (this.constructor.isRoute) {
            this.addClass('ui-route');
            this.setAttributes({ id: name });
        }
        else if (this.constructor.isComponent) {
            this.addClass('ui-component', `ui-component-${toHyphenCase(name)}`);
        }
        else {
            this.setAttributes({ id: name });
        }
        this.addClass(...(this.options.classNames || []));
        this.setAttributes(this.options.attributes);
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
                if (ev.defaultPrevented) {
                    return;
                }
                let targetElement = ev.target;
                while (targetElement && targetElement !== this.el) {
                    if (targetElement.tagName.toLowerCase() === 'a')
                        break;
                    targetElement = targetElement.parentElement;
                }
                if (targetElement && targetElement.tagName.toLowerCase() === 'a') {
                    const anchor = targetElement;
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
            return;
        }
        else if (this.options.model instanceof Model) {
            return this.options.model;
        }
        let model;
        const attributes = this.options.model;
        if (typeof attributes === 'string') {
            model = await this.app.newModel(`model-${this.options.model}`);
        }
        else {
            const type = this.options.modelType;
            if (type) {
                if (Array.isArray(type)) {
                    console.warn(`Ambiguous model type: ${type.join(', ')}. Please specify modelType in view options.`, this);
                }
                else {
                    model = await this.app.newModel(`model-${type}`, {
                        attributes,
                    });
                }
            }
            else {
                console.warn(`Unknown model type. Please specify modelType in view options.`, this);
            }
        }
        return model;
    }
    setAttributes(attributes, options) {
        if (!attributes)
            return this;
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
                    delete this.el.dataset[dataKey];
                }
            }
            else {
                this.el.setAttribute(attributeName, value);
                if (attributeName.startsWith('data-')) {
                    const dataKey = attributeName.slice(5);
                    this.el.dataset[dataKey] = value;
                }
            }
        }
        return this;
    }
    setErrorState(msg, options = {}) {
        if (this.isDestroyed)
            return;
        this.removeErrorState();
        const errorElement = errorTemplate(msg);
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
export default View;
export function isAttachReference(val) {
    return (val &&
        typeof val === 'object' &&
        'view' in val &&
        'id' in val &&
        val.view instanceof View &&
        typeof val.id === 'string');
}
//# sourceMappingURL=view.js.map