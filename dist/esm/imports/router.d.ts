import type { ClassMapTypeRouteView } from 'zeyon/_maps';
export interface RouterOptions {
    routes: RouteConfig[];
    urlPrefix?: string;
}
export interface NavigateOptions {
    route?: string;
    registrationId?: boolean;
    preserveQuery?: boolean;
    toHome?: boolean;
    newTab?: boolean;
    force?: boolean;
}
export interface RouteConfig<CustomRouteProps extends {} = {}> {
    registrationId: string & keyof ClassMapTypeRouteView;
    urlFragment: string;
    is404?: boolean;
    childRoutes?: RouteConfig<CustomRouteProps>[];
    custom?: CustomRouteProps;
}
export type FlatMap<CustomRouteProps extends {} = {}> = {
    [str: string]: RouteConfig<CustomRouteProps>;
};
export interface SiteMapRouteConfig extends Omit<RouteConfig, 'urlFragment' | 'is404' | 'childRoutes'> {
    fullUrl: string;
    childRoutes?: SiteMapRouteConfig[];
}
export type SiteMap = SiteMapRouteConfig[];
export type NavigateEventPayload<CustomRouteProps extends {} = {}> = {
    regId: string;
} & CustomRouteProps;
//# sourceMappingURL=router.d.ts.map