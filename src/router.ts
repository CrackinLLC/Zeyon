import type HarnessApp from './app';
import Emitter from './emitter';
import type { RouteConfig, RouteNode, RouterOptions } from './imports/router';
import type View from './view';

export default class Router<CustomRouteProps = any> extends Emitter {
  private currentPath: string = '';
  private currentRoute: View | undefined;
  private routes: RouteConfig<CustomRouteProps>[];
  private urlMap: RouteNode = { segment: '', children: new Map() };
  private urlPrefix: string | undefined;
  private notFound: RouteConfig<CustomRouteProps> | undefined; // Special property for storing 404 page, if provided

  constructor({ routes, urlPrefix }: RouterOptions<CustomRouteProps>, app: HarnessApp) {
    super(
      {
        events: [
          'navigate', // A new route was loaded
          'query', // The query parameter has changed
        ],
      },
      app,
    );

    this.routes = routes;
    this.urlPrefix = urlPrefix;

    this.currentPath = this.standardizeUrl(new URL(this.app.window.location.href).pathname);
    this.preprocessRoutes();
  }

  start() {
    this.app.window.addEventListener('popstate', () => this.loadRouteFromUrl());
    this.navigate({ preserveQuery: true, force: true }); // Load the initial route view
  }

  async navigate({
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

  back() {
    this.app.window.history.back();
  }

  async loadRouteFromUrl(force = false) {
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
      }

      try {
        // Instantiate and render the new view
        this.currentRoute = await this.app
          .newInstance<View>(route.regId, {
            ...(params && Object.keys(params).length ? { params } : {}),
            ...(query ? { query } : {}),
            ...(hash ? { hash } : {}),
            attachTo: this.app.el,
          })
          .then((view) => view.render());

        this.emit('navigate', { regId: route.regId, ...(customProps || {}) });
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
        ...(currentNode.aggregatedCustom ? { customProps: currentNode.aggregatedCustom } : {}),
      };
    }

    return undefined;
  }

  private preprocessRoutes() {
    const processConfig = (
      config: RouteConfig<CustomRouteProps>,
      currentNode: RouteNode<CustomRouteProps>,
      parentCustom: CustomRouteProps,
    ) => {
      const segments = config.urlFragment.split('/').filter(Boolean);

      segments.forEach((segment) => {
        let node: RouteNode<CustomRouteProps> | undefined;

        let paramName: string | undefined;

        if (segment.startsWith(':')) {
          // Dynamic segment
          paramName = segment.substring(1);
          node = currentNode.children.get(':###');
          if (!node) {
            node = { segment: ':###', children: new Map(), paramName };
            currentNode.children.set(':###', node);
          }
        } else {
          // Static segment
          node = currentNode.children.get(segment);
          if (!node) {
            node = { segment, children: new Map() };
            currentNode.children.set(segment, node);
          }
        }

        currentNode = node;
      });

      // At the end of the segments, set the config
      if (currentNode.config) {
        throw new Error(`Duplicate route for this path: ${config.urlFragment}`);
      }

      // Aggregate custom properties from parent and current config
      const aggregatedCustom = { ...parentCustom, ...(config.custom || {}) };
      currentNode.config = config;
      currentNode.aggregatedCustom = aggregatedCustom;

      if (config.is404) {
        this.notFound = config;
      }

      if (config.childRoutes) {
        config.childRoutes.forEach((childConfig) => {
          processConfig(childConfig, currentNode, aggregatedCustom);
        });
      }
    };

    // Start processing from the root node
    this.routes.forEach((routeConfig) => {
      processConfig(routeConfig, this.urlMap, {} as CustomRouteProps);
    });
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
