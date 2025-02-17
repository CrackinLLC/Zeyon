import { ClassMapTypeRouteView } from 'zeyon/imports';

export interface RouterOptions {
  routes: RouteConfig[];
  urlPrefix?: string; // A custom url prefix used across the entire application
}

/**
 * Options for the navigate method
 */
export interface NavigateOptions {
  route?: string;
  registrationId?: boolean;
  preserveQuery?: boolean;

  toHome?: boolean; // If true, will navigate to the root route
  newTab?: boolean; // If true, will open the URL in a new tab
  force?: boolean;
}

// TODO: Extend to allow for metadata instead and support dynamic fetching
export interface RouteConfig<CustomRouteProps extends {} = {}> {
  registrationId: string & keyof ClassMapTypeRouteView;
  urlFragment: string; // Fragment to append to the url path (excludes leading/trailing slashes)
  is404?: boolean; // Defines the 404 page for the application (last one defined takes precedence)
  childRoutes?: RouteConfig<CustomRouteProps>[];

  // Custom values passed into navigation events. Parent values are inherited by their childRoutes and can be overridden.
  custom?: CustomRouteProps;
}

// A flat object intended to store routes by an identifying string
export type FlatMap<CustomRouteProps extends {} = {}> = {
  [str: string]: RouteConfig<CustomRouteProps>;
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
