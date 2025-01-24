import type { ClassMapTypeRouteView } from '../_maps';
export interface RouterOptions {
    routes: RouteConfig[];
    urlPrefix?: string;
}
export interface RouteConfig<CustomRouteProps extends {} = {}> {
    registrationId: keyof ClassMapTypeRouteView;
    urlFragment: string;
    is404?: boolean;
    childRoutes?: RouteConfig<CustomRouteProps>[];
    custom?: CustomRouteProps;
}
export type FlatMap<CustomRouteProps extends {} = {}> = {
    [idOrPath: string]: RouteConfig<CustomRouteProps>;
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