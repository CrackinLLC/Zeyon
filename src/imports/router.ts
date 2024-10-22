export interface RouterOptions<CustomRouteProps = any> {
  routes: RouteConfig<CustomRouteProps>[];
  urlPrefix?: string; // A custom url prefix used across the entire application
}

export interface RouteConfig<CustomRouteProps = any> {
  regId: string; // Unique registration id for the route. MUST BE UNIQUE across the entire application.
  urlFragment: string; // Fragment to append to the url path (excludes leading/trailing slashes)

  name?: string; // Human-friendly display string for route
  childRoutes?: RouteConfig<CustomRouteProps>[];
  is404?: boolean; // Defines the 404 page for the application (last defined takes precedence)

  // Custom values passed into navigation events. Parent values are inherited by their childRoutes and can be overridden.
  custom?: CustomRouteProps;
}

// Internal map that reorganizes the routeConfigs for easier retrieval by url path
export interface RouteNode<CustomRouteProps = any> {
  segment: string; // The path segment leading to this node in the tree
  children: Map<string, RouteNode<CustomRouteProps>>; // Child nodes
  config?: RouteConfig<CustomRouteProps>; // The route config associated with this node
  paramName?: string; // If node is dynamic, the name of the dynamic parameter
  aggregatedCustom?: CustomRouteProps; // Aggregated custom properties
}

export type NavigateEventPayload<CustomRouteProps = any> = {
  regId: string;
} & CustomRouteProps;
