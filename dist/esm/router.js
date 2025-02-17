import { routerEvents } from './_events';
import Emitter from './emitter';
class Router extends Emitter {
    constructor({ urlPrefix, routes }, app) {
        super({ events: routerEvents }, app);
        this.currentPath = '';
        this.routes = [];
        this.urlMap = {};
        this.registrationIdMap = {};
        this.siteMap = [];
        this.urlPrefix = urlPrefix;
        this.currentPath = this.standardizeUrl(new URL(this.app.window.location.href).pathname);
        this.registerRoutes(routes);
    }
    registerRoutes(routes) {
        this.routes = routes;
        this.urlMap = {};
        this.registrationIdMap = {};
        this.siteMap = [];
        const processRoute = (route, parentPath, parentSiteNode) => {
            const fullPath = this.standardizeUrl(parentPath + '/' + route.urlFragment);
            if (this.urlMap[fullPath]) {
                throw new Error(`Route collision: another route already exists at "${fullPath}".`);
            }
            this.urlMap[fullPath] = route;
            this.registrationIdMap[String(route.registrationId)] = fullPath;
            if (fullPath === '/') {
                if (this.root) {
                    console.warn('Multiple root routes defined. Only the last one will be used.');
                }
                this.root = route;
            }
            if (route.is404) {
                this.notFound = route;
            }
            const siteNode = {
                registrationId: route.registrationId,
                fullUrl: fullPath,
                custom: route.custom,
                childRoutes: [],
            };
            if (parentSiteNode) {
                parentSiteNode.childRoutes?.push(siteNode);
            }
            else {
                this.siteMap.push(siteNode);
            }
            if (route.childRoutes && route.childRoutes.length > 0) {
                for (const child of route.childRoutes) {
                    processRoute(child, fullPath, siteNode);
                }
            }
        };
        this.routes.forEach((r) => processRoute(r, '', null));
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
    getPathByRegistrationId(regId) {
        return this.registrationIdMap[regId];
    }
    getSiteMap(urlPath) {
        if (!urlPath) {
            return this.siteMap;
        }
        const findSiteMapNode = (urlPath, nodes) => {
            for (const node of nodes) {
                if (node.fullUrl === urlPath) {
                    return node;
                }
                if (node.childRoutes) {
                    const match = findSiteMapNode(urlPath, node.childRoutes);
                    if (match)
                        return match;
                }
            }
            return undefined;
        };
        return findSiteMapNode(urlPath, this.siteMap) || [];
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
    navigateToRoot() {
        if (this.root) {
            this.navigate({ toHome: true });
        }
    }
    async navigate({ route = this.app.window.location.pathname, toHome = false, force = false, preserveQuery = false, registrationId = false, }) {
        let path;
        if (toHome) {
            path = '/';
        }
        else if (registrationId) {
            path = this.getPathByRegistrationId(route);
            if (!path) {
                console.error(`No route found for registrationId: "${route}"`);
                return;
            }
        }
        else {
            path = this.standardizeUrl(route);
        }
        let canProceed = true;
        if (this.currentRoute?.onBeforeNavigate) {
            canProceed = await this.currentRoute.onBeforeNavigate(path);
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
            let params = {};
            if (matchResult) {
                route = matchResult.route;
                params = matchResult.params || {};
            }
            else if (this.notFound) {
                route = this.notFound;
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
                    ...(Object.keys(params).length ? { params } : {}),
                    ...(Object.keys(query).length ? { query } : {}),
                    ...(hash ? { hash } : {}),
                    attachTo: this.app.el,
                })
                    .then((routeView) => routeView.render());
                this.currentRouteConfig = route;
                this.emit('navigate', { regId: route.registrationId, ...(route.custom || {}) });
            }
            catch (error) {
                console.error('Error loading route:', error);
            }
        }
    }
    matchPathToRoute(path) {
        if (this.urlMap[path]) {
            return {
                route: this.urlMap[path],
                params: {},
            };
        }
        for (const patternKey of Object.keys(this.urlMap)) {
            if (!patternKey.includes(':'))
                continue;
            const maybeParams = this.matchDynamicSegments(path, patternKey);
            if (maybeParams) {
                return {
                    route: this.urlMap[patternKey],
                    params: maybeParams,
                };
            }
        }
        return undefined;
    }
    matchDynamicSegments(path, pattern) {
        const pathSegments = path.split('/').filter(Boolean);
        const patternSegments = pattern.split('/').filter(Boolean);
        const params = {};
        let pi = 0;
        for (let i = 0; i < patternSegments.length; i++) {
            const segment = patternSegments[i];
            const pathValue = pathSegments[pi];
            if (!segment.startsWith(':')) {
                if (segment !== pathValue) {
                    return undefined;
                }
                pi++;
            }
            else {
                const isOptional = segment.endsWith('?');
                const paramName = isOptional
                    ? segment.slice(1, -1)
                    : segment.slice(1);
                if (pathValue === undefined) {
                    if (!isOptional) {
                        return undefined;
                    }
                }
                else {
                    params[paramName] = decodeURIComponent(pathValue);
                    pi++;
                }
            }
        }
        if (pi < pathSegments.length) {
            return undefined;
        }
        return params;
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