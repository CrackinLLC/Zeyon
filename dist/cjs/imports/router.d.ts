export interface RouterOptions<CustomRouteProps = any> {
    routes: RouteConfig<CustomRouteProps>[];
    urlPrefix?: string;
}
export interface RouteConfig<CustomRouteProps = any> {
    regId: string;
    urlFragment: string;
    name?: string;
    childRoutes?: RouteConfig<CustomRouteProps>[];
    is404?: boolean;
    custom?: CustomRouteProps;
}
export interface RouteNode<CustomRouteProps = any> {
    segment: string;
    children: Map<string, RouteNode<CustomRouteProps>>;
    config?: RouteConfig<CustomRouteProps>;
    paramName?: string;
    custom?: CustomRouteProps;
}
export interface SiteMapRouteDetail<CustomProps = any> {
    regId: string;
    name?: string;
    fullUrl: string;
    custom: CustomProps;
    children: SiteMapRouteDetail<CustomProps>[];
}
export type NavigateEventPayload<CustomRouteProps = any> = {
    regId: string;
} & CustomRouteProps;
//# sourceMappingURL=router.d.ts.map