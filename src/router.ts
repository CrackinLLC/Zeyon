import type ZeyonApp from './app';
import Emitter from './emitter';
import type { RouteConfig, RouteNode, RouterOptions, SiteMapRouteDetail } from './imports/router';
import type RouteView from './routeView';

export default class Router<CustomRouteProps = any> extends Emitter {
  static override registrationId: string = 'zeyon-router';

  private currentPath: string = '';
  private currentRoute: RouteView | undefined;
  private currentRouteConfig: RouteConfig<CustomRouteProps> | undefined;
  private routes: RouteConfig<CustomRouteProps>[] = [];
  private notFound: RouteConfig<CustomRouteProps> | undefined; // Special property for storing 404 page, if provided

  private urlMap: RouteNode = { segment: '', children: new Map() };
  private siteMap: SiteMapRouteDetail<CustomRouteProps>[] = [];
  private urlPrefix: string | undefined;

  constructor({ urlPrefix }: RouterOptions, app: ZeyonApp) {
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
    this.preprocessRoutes();
  }

  public registerRoutes<C extends CustomRouteProps>(routes: RouteConfig<C>[]) {
    this.routes = { ...this.routes, ...routes };
  }

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

  public getCurrentRouteConfig(): RouteConfig<CustomRouteProps> | undefined {
    return this.currentRouteConfig;
  }

  public getSiteMap(options: { exclude?: Partial<CustomRouteProps> } = {}): SiteMapRouteDetail<CustomRouteProps>[] {
    const { exclude } = options;

    if (!exclude) return this.siteMap;

    const filterSiteMap = (routes: SiteMapRouteDetail<CustomRouteProps>[]): SiteMapRouteDetail<CustomRouteProps>[] => {
      return routes
        .filter((route) => {
          // Check if any of the exclude properties match
          for (const [key, value] of Object.entries(exclude)) {
            if ((route.custom as any)[key] === value) {
              return false; // Exclude this route
            }
          }
          return true; // Include this route
        })
        .map((route) => ({
          ...route,
          children: filterSiteMap(route.children),
        }));
    };

    return filterSiteMap(this.siteMap);
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

      const matchResult = this.matchPathToRoute(path);
      let route: RouteConfig<CustomRouteProps> | undefined;
      let params: Record<string, string> | undefined;
      let customProps: CustomRouteProps | undefined;

      if (matchResult) {
        route = matchResult.route;
        params = matchResult.params;
        customProps = matchResult.customProps;
      } else if (this.notFound) {
        route = this.notFound;
        customProps = route.custom;
      } else {
        console.warn(`No matching route found for path: ${path}`);
        return;
      }

      // TODO: Set a loading state on the app until render from route has resolved

      const query = Object.fromEntries(url.searchParams.entries());
      const hash = url.hash ? url.hash.substring(1) : undefined;

      if (this.currentRoute) {
        this.currentRoute.destroy();
        this.currentRouteConfig = undefined;
      }

      try {
        // Instantiate and render the new view
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
      } catch (error) {
        console.error('Error loading route:', error);
      }
    }
  }

  private matchPathToRoute(
    path: string,
  ):
    | { route: RouteConfig<CustomRouteProps>; params?: Record<string, string>; customProps?: CustomRouteProps }
    | undefined {
    const segments = path.split('/').filter(Boolean);
    let currentNode = this.urlMap;
    const params: Record<string, string> = {};

    for (const segment of segments) {
      let nextNode = currentNode.children.get(segment);

      if (!nextNode) {
        // Check for dynamic segment
        nextNode = currentNode.children.get(':###');
        if (nextNode && nextNode.paramName) {
          // Store the parameter value
          params[nextNode.paramName] = decodeURIComponent(segment);
        } else {
          return undefined; // No matching route
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

  /**
   * This method traverses the value stored on this.routes to generate a urlMap that facilitates
   * quickly finding the correct route config for a given url, and a siteMap that can be used by
   * other classes to facilitate auto-generating navigational components.
   */
  private preprocessRoutes() {
    const processConfig = (
      config: RouteConfig<CustomRouteProps>,
      currentNode: RouteNode<CustomRouteProps>,
      parentCustom: CustomRouteProps,
      parentUrl: string,
    ): SiteMapRouteDetail<CustomRouteProps> => {
      const segments = config.urlFragment.split('/').filter(Boolean);

      let node = currentNode;
      let fullUrl = parentUrl;

      segments.forEach((segment) => {
        let childNode: RouteNode<CustomRouteProps> | undefined;
        let paramName: string | undefined;

        if (segment.startsWith(':')) {
          // Dynamic segment
          paramName = segment.substring(1);
          childNode = node.children.get(':###');
          if (!childNode) {
            childNode = { segment: ':###', children: new Map(), paramName };
            node.children.set(':###', childNode);
          }
        } else {
          // Static segment
          childNode = node.children.get(segment);
          if (!childNode) {
            childNode = { segment, children: new Map() };
            node.children.set(segment, childNode);
          }
        }

        node = childNode;

        // Build the full URL incrementally
        const segmentPart = paramName ? `:${paramName}` : segment;
        fullUrl = this.standardizeUrl(`${fullUrl}/${segmentPart}`);
      });

      // At the end of the segments, set the config
      if (node.config) {
        throw new Error(`Duplicate route for this path: ${config.urlFragment}`);
      }

      // Aggregate custom properties from parent and current config
      const custom = { ...parentCustom, ...(config.custom || {}) };
      node.config = config;
      node.custom = custom;

      if (config.is404) {
        this.notFound = config;
      }

      // Create the site map entry for this route
      const siteMapEntry: SiteMapRouteDetail<CustomRouteProps> = {
        regId: config.registrationId,
        fullUrl,
        custom,
        children: [],
      };

      // Process child routes
      if (config.childRoutes) {
        config.childRoutes.forEach((childConfig) => {
          const childSiteMapEntry = processConfig(childConfig as RouteConfig<CustomRouteProps>, node, custom, fullUrl);
          siteMapEntry.children.push(childSiteMapEntry);
        });
      }

      return siteMapEntry;
    };

    // Start processing from the root node and build the site map
    this.siteMap = this.routes.map((routeConfig) =>
      processConfig(routeConfig, this.urlMap, {} as CustomRouteProps, ''),
    );
  }

  private standardizeUrl(url: string, addBase = false): string {
    if (this.urlPrefix) {
      if (addBase) {
        url = `${this.urlPrefix}${url}`;
      } else if (url.startsWith(this.urlPrefix)) {
        url = url.slice(this.urlPrefix.length);
      }
    }

    if (!url || url === '/') {
      return '/';
    } else {
      // Ensure path does not have trailing slash (unless it's root '/')
      return `/${url.replace(/^\/|\/$/g, '')}`;
    }
  }
}
