"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const classRegistry_1 = __importDefault(require("./classRegistry"));
const router_1 = __importDefault(require("./router"));
const loader_1 = require("./util/loader");
class ZeyonApp {
    constructor(options) {
        this.options = options;
        this.name = '';
        this.isStarted = false;
        this.loadingState = null;
        const { name, el, urlPrefix } = options;
        this.isReady = new Promise((resolve) => {
            this.resolveIsReady = resolve;
        });
        this.name = name || '';
        this.el = el;
        this.window = window;
        this.router = new router_1.default({ urlPrefix }, this);
        this.registry = new classRegistry_1.default({}, this);
    }
    registerRoutes(routes) {
        this.router.registerRoutes(routes);
        return this;
    }
    setGlobalViews(layouts) {
        if (!Array.isArray(layouts)) {
            layouts = [layouts];
        }
        layouts.forEach(({ selector, registrationId, options }) => {
            const element = document.querySelector(selector);
            if (element) {
                this.newView(registrationId, {
                    ...(options || {}),
                    attachTo: element,
                }).then((view) => view?.render());
            }
            else {
                console.warn(`Element not found for selector: ${selector}`);
            }
        });
        return this;
    }
    async start() {
        if (!this.isStarted) {
            this.isStarted = true;
            this.router.start();
            this.resolveIsReady(this);
        }
        return this;
    }
    navigate(urlFragment, openNewTab = false) {
        const baseUrl = new URL(document.baseURI);
        const url = new URL(urlFragment, baseUrl);
        if (url.origin !== baseUrl.origin || openNewTab) {
            window.open(url.href, '_blank');
        }
        else {
            this.router.navigate({ path: urlFragment });
        }
        return this;
    }
    async newView(registrationId, options) {
        return this.newInstance(registrationId, options);
    }
    async newRouteView(registrationId, options) {
        return this.newInstance(registrationId, options);
    }
    async newModel(registrationId, options) {
        return this.newInstance(registrationId, options);
    }
    async newCollection(registrationId, options) {
        return this.newInstance(registrationId, options);
    }
    async newCollectionView(registrationId, options) {
        return this.newInstance(registrationId, options);
    }
    async newInstance(registrationId, options) {
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
        return instance;
    }
    toggleClass(className, add) {
        this.el.classList.toggle(className, add);
        return this;
    }
    setLoadingState(show) {
        if (typeof show !== 'boolean') {
            show = !this.loadingState;
        }
        if (show && !this.loadingState) {
            this.loadingState = (0, loader_1.loaderTemplate)({ wrapped: true });
            this.el.appendChild(this.loadingState);
        }
        else if (!show && this.loadingState) {
            this.loadingState.remove();
            this.loadingState = null;
        }
        return show;
    }
}
exports.default = ZeyonApp;
//# sourceMappingURL=app.js.map