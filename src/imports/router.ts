import type { ClassMapTypeRouteView } from '../_maps';

export interface RouterOptions {
  routes: RouteConfig[];
  urlPrefix?: string; // A custom url prefix used across the entire application
}

// TODO: Extend to allow for metadata instead and support dynamic fetching
export interface RouteConfig<CustomRouteProps extends {} = {}> {
  registrationId: keyof ClassMapTypeRouteView;
  urlFragment: string; // Fragment to append to the url path (excludes leading/trailing slashes)
  is404?: boolean; // Defines the 404 page for the application (last one defined takes precedence)
  childRoutes?: RouteConfig<CustomRouteProps>[];

  // Custom values passed into navigation events. Parent values are inherited by their childRoutes and can be overridden.
  custom?: CustomRouteProps;
}

// Flat object intended to store all routes by their full path string
export type FlatMap<CustomRouteProps extends {} = {}> = {
  [idOrPath: string]: RouteConfig<CustomRouteProps>;
};

// Similar to our RouteConfig, but specifically intended for our sitemap
export interface SiteMapRouteConfig extends Omit<RouteConfig, 'urlFragment' | 'is404' | 'childRoutes'> {
  fullUrl: string;
  childRoutes?: SiteMapRouteConfig[];
}

export type SiteMap = SiteMapRouteConfig[];

export type NavigateEventPayload<CustomRouteProps extends {} = {}> = {
  regId: string;
} & CustomRouteProps;
