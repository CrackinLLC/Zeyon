import Emitter from './emitter';
import { ZeyonAppLike } from './imports/app';
import type { FlatMap, RouteConfig, RouterOptions, SiteMap, SiteMapRouteConfig } from './imports/router';
import type RouteView from './routeView';

export default class Router extends Emitter {
  static override registrationId: string = 'zeyon-router';

  private currentPath: string = '';
  private currentRoute: RouteView | undefined;
  private currentRouteConfig: RouteConfig | undefined;

  /**
   * Original route array from config
   */
  private routes: RouteConfig[] = [];

  /**
   * Flat dictionary from 'fullUrl' => route
   */
  private urlMap: FlatMap = {};

  /**
   * Flat dictionary from 'registrationId' => route
   */
  private registrationIdMap: FlatMap = {};

  /**
   * a
   */
  private siteMap: SiteMap = [];

  private root: RouteConfig | undefined; // Stores the application's root route id
  private notFound: RouteConfig | undefined; // Stores the application's 404 page id (optional)

  private urlPrefix: string | undefined;

  constructor({ urlPrefix, routes }: RouterOptions, app: ZeyonAppLike) {
    super(
      {
        events: [
          'navigate', // A new route was loaded
          'query', // The query parameter has changed
        ],
      },
      app,
    );

    this.urlPrefix = urlPrefix;
    this.currentPath = this.standardizeUrl(new URL(this.app.window.location.href).pathname);

    this.registerRoutes(routes);
  }

  /**
   * Set navigation routes and preprocess them into our internal data structures.
   */
  public registerRoutes(routes: RouteConfig[]): void {
    this.routes = routes;

    // Wipe maps before processing
    this.urlMap = {};
    this.registrationIdMap = {};
    this.siteMap = [];

    const processRoute = (route: RouteConfig, parentPath: string, parentSiteNode: SiteMapRouteConfig | null) => {
      const fullPath = this.standardizeUrl(parentPath + '/' + route.urlFragment);

      // Check for collision in urlMap
      if (this.urlMap[fullPath]) {
        throw new Error(`Route collision: another route already exists at "${fullPath}".`);
      }

      // Store route on both our flat maps
      this.urlMap[fullPath] = route;
      this.registrationIdMap[String(route.registrationId)] = route;

      if (fullPath === '/') {
        if (this.root) {
          console.warn('Multiple root routes defined. Only the last one will be used.');
        }

        this.root = route;
      }

      if (route.is404) {
        this.notFound = route;
      }

      // Build the siteMap node
      const siteNode: SiteMapRouteConfig = {
        registrationId: route.registrationId,
        fullUrl: fullPath,
        custom: route.custom,
        childRoutes: [],
      };

      if (parentSiteNode) {
        parentSiteNode.childRoutes?.push(siteNode);
      } else {
        this.siteMap.push(siteNode);
      }

      // Recurse for children
      if (route.childRoutes && route.childRoutes.length > 0) {
        for (const child of route.childRoutes) {
          processRoute(child, fullPath, siteNode);
        }
      }
    };

    this.routes.forEach((r) => processRoute(r, '', null));
  }

  /**
   * Begin observing the browser for path changes
   */
  public start() {
    this.app.window.addEventListener('popstate', () => this.loadRouteFromUrl());
    this.navigate({ preserveQuery: true, force: true }); // Load the initial route view
  }

  public getCurrentPath(): string {
    return this.currentPath;
  }

  public getCurrentRoute(): RouteView | undefined {
    return this.currentRoute;
  }

  public getCurrentRouteConfig(): RouteConfig | undefined {
    return this.currentRouteConfig;
  }

  public getRouteById(regId: string): RouteConfig | undefined {
    return this.registrationIdMap[regId];
  }

  /**
   * Sitemap of all routes registered with the router, including their child routes,
   * used to facilitate the dynamic generation of app navigation components.
   */
  public getSiteMap(urlPath?: string): SiteMapRouteConfig | SiteMapRouteConfig[] {
    if (!urlPath) {
      return this.siteMap;
    }

    const findSiteMapNode = (urlPath: string, nodes: SiteMapRouteConfig[]): SiteMapRouteConfig | undefined => {
      for (const node of nodes) {
        if (node.fullUrl === urlPath) {
          return node;
        }

        if (node.childRoutes) {
          const match = findSiteMapNode(urlPath, node.childRoutes);
          if (match) return match;
        }
      }

      return undefined;
    };

    // Find node for the requested path
    return findSiteMapNode(urlPath, this.siteMap) || [];
  }

  /**
   * Set or clear the query parameters in the current address.
   */
  public setQueryParams(params: { [key: string]: string | null | undefined }) {
    const url = new URL(this.app.window.location.href);
    const searchParams = new URLSearchParams(url.search);

    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        // Use "null" to remove parameters
        searchParams.delete(key);
      } else if (value !== undefined) {
        searchParams.set(key, value);
      }
      // If value is undefined, leave it unchanged
    });

    url.search = searchParams.toString();
    this.app.window.history.replaceState({}, '', url.toString());
  }

  public navigateToRoot() {
    // TODO: Either strictly enforce at least one root route, or design handling for "no root defined"
    if (this.root) {
      this.navigate({ path: '/' });
    }
  }

  public async navigate({
    path = this.app.window.location.pathname,
    preserveQuery = false,
    force = false,
  }: {
    path?: string;
    preserveQuery?: boolean;
    force?: boolean;
  }) {
    path = this.standardizeUrl(path);

    // Hook to allow a view to prevent navigation if needed
    let canProceed = true;
    if (this.currentRoute?.beforeNavigate) {
      canProceed = await this.currentRoute.beforeNavigate(path);
    }
    if (!canProceed) return;

    const currentUrl = new URL(this.app.window.location.href);
    let newUrl = `${currentUrl.origin}${this.standardizeUrl(path, true)}`;

    if (preserveQuery) {
      newUrl += currentUrl.search + currentUrl.hash;
    }

    // Prevent pushing to history if the path hasn't changed
    if (newUrl !== this.app.window.location.href) {
      this.app.window.history.pushState({}, '', newUrl);
    }

    await this.loadRouteFromUrl(force);
  }

  public back() {
    this.app.window.history.back();
  }

  private async loadRouteFromUrl(force = false) {
    const url = new URL(this.app.window.location.href);
    const path = this.standardizeUrl(url.pathname);

    if (path !== this.currentPath || force) {
      this.currentPath = path;

      // Attempt to match a route
      const matchResult = this.matchPathToRoute(path);
      let route: RouteConfig | undefined;
      let params: Record<string, string> = {};

      if (matchResult) {
        route = matchResult.route;
        params = matchResult.params || {};
      } else if (this.notFound) {
        route = this.notFound;
      } else {
        console.warn(`No matching route found for path: ${path}`);
        return;
      }

      // Gather other data from the URL
      const query = Object.fromEntries(url.searchParams.entries());
      const hash = url.hash ? url.hash.substring(1) : undefined;

      // Destroy the previous route, if any
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
      } catch (error) {
        console.error('Error loading route:', error);
      }
    }
  }

  private matchPathToRoute(path: string):
    | {
        route: RouteConfig;
        params: Record<string, string>;
      }
    | undefined {
    // 1) Check direct match
    if (this.urlMap[path]) {
      return {
        route: this.urlMap[path],
        params: {},
      };
    }

    // 2) Attempt dynamic match for patterns that have ":" in them
    for (const patternKey of Object.keys(this.urlMap)) {
      if (!patternKey.includes(':')) continue; // only dynamic patterns

      const maybeParams = this.matchDynamicSegments(path, patternKey);
      if (maybeParams) {
        return {
          route: this.urlMap[patternKey],
          params: maybeParams,
        };
      }
    }

    return undefined; // no direct or dynamic match
  }

  /**
   * Attempts to match a URL path to a pattern with dynamic segments (":id" or ":id?" for optional).
   * Returns an object of extracted param values, or undefined if no match.
   *
   * e.g.
   *   path = "/about/career/123"
   *   pattern = "/about/career/:id"
   *   => { id: "123" }
   *
   *   optional segments (":id?") can also be processed.
   */
  private matchDynamicSegments(path: string, pattern: string): Record<string, string> | undefined {
    const pathSegments = path.split('/').filter(Boolean);
    const patternSegments = pattern.split('/').filter(Boolean);

    const params: Record<string, string> = {};

    let pi = 0; // pointer to pathSegments
    for (let i = 0; i < patternSegments.length; i++) {
      const segment = patternSegments[i];
      const pathValue = pathSegments[pi];

      if (!segment.startsWith(':')) {
        // It's a literal
        if (segment !== pathValue) {
          return undefined; // mismatch
        }
        pi++;
      } else {
        // It's a dynamic segment (":id" or ":id?")
        const isOptional = segment.endsWith('?');
        const paramName = isOptional
          ? segment.slice(1, -1) // remove ":" and "?"
          : segment.slice(1); // remove ":"

        if (pathValue === undefined) {
          // If no pathValue available but segment is optional => skip it
          // If required => mismatch
          if (!isOptional) {
            return undefined;
          }
        } else {
          // fill param
          params[paramName] = decodeURIComponent(pathValue);
          pi++;
        }
      }
    }

    // If path had extra segments beyond the pattern's length => mismatch,
    // unless you want to allow trailing segments to be part of the pattern
    if (pi < pathSegments.length) {
      return undefined; // leftover path that didn't match the pattern
    }

    return params;
  }

  private standardizeUrl(url: string, includePrefix = false): string {
    if (this.urlPrefix) {
      if (includePrefix) {
        url = `${this.urlPrefix}${url}`;
      } else if (url.startsWith(this.urlPrefix)) {
        url = url.slice(this.urlPrefix.length);
      }
    }

    if (!!url && url !== '/') {
      // Ensure non-root path doesn't have trailing slash
      return `/${url.replace(/^\/|\/$/g, '')}`;
    }

    return '/';
  }
}
