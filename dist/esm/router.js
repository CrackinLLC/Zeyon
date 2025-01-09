import Emitter from './emitter';
class Router extends Emitter {
    constructor({ urlPrefix }, app) {
        super({
            events: [
                'navigate',
                'query',
            ],
        }, app);
        this.currentPath = '';
        this.routes = [];
        this.urlMap = { segment: '', children: new Map() };
        this.siteMap = [];
        this.urlPrefix = urlPrefix;
        this.currentPath = this.standardizeUrl(new URL(this.app.window.location.href).pathname);
        this.preprocessRoutes();
    }
    registerRoutes(routes) {
        this.routes = { ...this.routes, ...routes };
    }
    start() {
        this.app.window.addEventListener('popstate', () => this.loadRouteFromUrl());
        this.navigate({ preserveQuery: true, force: true });
    }
    getCurrentPath() {
        return this.currentPath;
    }
    getCurrentRoute() {
        return this.currentRoute;
    }
    getCurrentRouteConfig() {
        return this.currentRouteConfig;
    }
    getSiteMap(options = {}) {
        const { exclude } = options;
        if (!exclude)
            return this.siteMap;
        const filterSiteMap = (routes) => {
            return routes
                .filter((route) => {
                for (const [key, value] of Object.entries(exclude)) {
                    if (route.custom[key] === value) {
                        return false;
                    }
                }
                return true;
            })
                .map((route) => ({
                ...route,
                children: filterSiteMap(route.children),
            }));
        };
        return filterSiteMap(this.siteMap);
    }
    setQueryParams(params) {
        const url = new URL(this.app.window.location.href);
        const searchParams = new URLSearchParams(url.search);
        Object.entries(params).forEach(([key, value]) => {
            if (value === null) {
                searchParams.delete(key);
            }
            else if (value !== undefined) {
                searchParams.set(key, value);
            }
        });
        url.search = searchParams.toString();
        this.app.window.history.replaceState({}, '', url.toString());
    }
    async navigate({ path = this.app.window.location.pathname, preserveQuery = false, force = false, }) {
        path = this.standardizeUrl(path);
        let canProceed = true;
        if (this.currentRoute?.beforeNavigate) {
            canProceed = await this.currentRoute.beforeNavigate(path);
        }
        if (!canProceed)
            return;
        const currentUrl = new URL(this.app.window.location.href);
        let newUrl = `${currentUrl.origin}${this.standardizeUrl(path, true)}`;
        if (preserveQuery) {
            newUrl += currentUrl.search + currentUrl.hash;
        }
        if (newUrl !== this.app.window.location.href) {
            this.app.window.history.pushState({}, '', newUrl);
        }
        await this.loadRouteFromUrl(force);
    }
    back() {
        this.app.window.history.back();
    }
    async loadRouteFromUrl(force = false) {
        const url = new URL(this.app.window.location.href);
        const path = this.standardizeUrl(url.pathname);
        if (path !== this.currentPath || force) {
            this.currentPath = path;
            const matchResult = this.matchPathToRoute(path);
            let route;
            let params;
            let customProps;
            if (matchResult) {
                route = matchResult.route;
                params = matchResult.params;
                customProps = matchResult.customProps;
            }
            else if (this.notFound) {
                route = this.notFound;
                customProps = route.custom;
            }
            else {
                console.warn(`No matching route found for path: ${path}`);
                return;
            }
            const query = Object.fromEntries(url.searchParams.entries());
            const hash = url.hash ? url.hash.substring(1) : undefined;
            if (this.currentRoute) {
                this.currentRoute.destroy();
                this.currentRouteConfig = undefined;
            }
            try {
                this.currentRoute = await this.app
                    .newRouteView(route.registrationId, {
                    ...(params && Object.keys(params).length ? { params } : {}),
                    ...(query ? { query } : {}),
                    ...(hash ? { hash } : {}),
                    attachTo: this.app.el,
                })
                    .then((routeView) => routeView.render());
                this.currentRouteConfig = route;
                this.emit('navigate', { regId: route.registrationId, ...(customProps || {}) });
            }
            catch (error) {
                console.error('Error loading route:', error);
            }
        }
    }
    matchPathToRoute(path) {
        const segments = path.split('/').filter(Boolean);
        let currentNode = this.urlMap;
        const params = {};
        for (const segment of segments) {
            let nextNode = currentNode.children.get(segment);
            if (!nextNode) {
                nextNode = currentNode.children.get(':###');
                if (nextNode && nextNode.paramName) {
                    params[nextNode.paramName] = decodeURIComponent(segment);
                }
                else {
                    return undefined;
                }
            }
            currentNode = nextNode;
        }
        if (currentNode.config) {
            return {
                route: currentNode.config,
                ...(params ? { params } : {}),
                ...(currentNode.custom ? { customProps: currentNode.custom } : {}),
            };
        }
        return undefined;
    }
    preprocessRoutes() {
        const processConfig = (config, currentNode, parentCustom, parentUrl) => {
            const segments = config.urlFragment.split('/').filter(Boolean);
            let node = currentNode;
            let fullUrl = parentUrl;
            segments.forEach((segment) => {
                let childNode;
                let paramName;
                if (segment.startsWith(':')) {
                    paramName = segment.substring(1);
                    childNode = node.children.get(':###');
                    if (!childNode) {
                        childNode = { segment: ':###', children: new Map(), paramName };
                        node.children.set(':###', childNode);
                    }
                }
                else {
                    childNode = node.children.get(segment);
                    if (!childNode) {
                        childNode = { segment, children: new Map() };
                        node.children.set(segment, childNode);
                    }
                }
                node = childNode;
                const segmentPart = paramName ? `:${paramName}` : segment;
                fullUrl = this.standardizeUrl(`${fullUrl}/${segmentPart}`);
            });
            if (node.config) {
                throw new Error(`Duplicate route for this path: ${config.urlFragment}`);
            }
            const custom = { ...parentCustom, ...(config.custom || {}) };
            node.config = config;
            node.custom = custom;
            if (config.is404) {
                this.notFound = config;
            }
            const siteMapEntry = {
                regId: config.registrationId,
                fullUrl,
                custom,
                children: [],
            };
            if (config.childRoutes) {
                config.childRoutes.forEach((childConfig) => {
                    const childSiteMapEntry = processConfig(childConfig, node, custom, fullUrl);
                    siteMapEntry.children.push(childSiteMapEntry);
                });
            }
            return siteMapEntry;
        };
        this.siteMap = this.routes.map((routeConfig) => processConfig(routeConfig, this.urlMap, {}, ''));
    }
    standardizeUrl(url, includePrefix = false) {
        if (this.urlPrefix) {
            if (includePrefix) {
                url = `${this.urlPrefix}${url}`;
            }
            else if (url.startsWith(this.urlPrefix)) {
                url = url.slice(this.urlPrefix.length);
            }
        }
        if (!!url && url !== '/') {
            return `/${url.replace(/^\/|\/$/g, '')}`;
        }
        return '/';
    }
}
Router.registrationId = 'zeyon-router';
export default Router;
//# sourceMappingURL=router.js.map