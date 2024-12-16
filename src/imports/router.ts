import type { ClassMapType } from '../generated/ClassMapType';

export interface RouterOptions {
  urlPrefix?: string; // A custom url prefix used across the entire application
}

export interface RegisterRoutesParam<CustomRouteProps = any> {
  routes: RouteConfig<CustomRouteProps>[];
}

// TODO: Extend to allow for metadata instead and support dynamic fetching
export interface RouteConfig<CustomRouteProps = any> {
  registrationId: keyof ClassMapType;
  urlFragment: string; // Fragment to append to the url path (excludes leading/trailing slashes)
  is404?: boolean; // Defines the 404 page for the application (last one defined takes precedence)
  childRoutes?: RouteConfig<CustomRouteProps>[];

  // Custom values passed into navigation events. Parent values are inherited by their childRoutes and can be overridden.
  custom?: CustomRouteProps;
}

// Internal map that reorganizes the routeConfigs for easier retrieval by url path
export interface RouteNode<CustomRouteProps = any> {
  segment: string; // The path segment leading to this node in the tree
  children: Map<string, RouteNode<CustomRouteProps>>; // Child nodes
  config?: RouteConfig<CustomRouteProps>; // The route config associated with this node
  paramName?: string; // If node is dynamic, the name of the dynamic parameter
  custom?: CustomRouteProps; // Aggregated custom properties
}

// Similar to our RouteNode, but specifically organized for our sitemap
export interface SiteMapRouteDetail<CustomProps = any> {
  regId: keyof ClassMapType;
  name?: string;
  fullUrl: string;
  custom: CustomProps;
  children: SiteMapRouteDetail<CustomProps>[];
}

export type NavigateEventPayload<CustomRouteProps = any> = {
  regId: string;
} & CustomRouteProps;
