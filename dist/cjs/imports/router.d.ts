import type { ClassMapTypeRouteView } from '../generated/ClassMapType';
export interface RouterOptions {
    urlPrefix?: string;
}
export interface RegisterRoutesParam<CustomRouteProps = any> {
    routes: RouteConfig<CustomRouteProps>[];
}
export interface RouteConfig<CustomRouteProps = any> {
    registrationId: keyof ClassMapTypeRouteView;
    urlFragment: string;
    is404?: boolean;
    childRoutes?: RouteConfig<CustomRouteProps>[];
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
    regId: keyof ClassMapTypeRouteView;
    name?: string;
    fullUrl: string;
    custom: CustomProps;
    children: SiteMapRouteDetail<CustomProps>[];
}
export type NavigateEventPayload<CustomRouteProps = any> = {
    regId: string;
} & CustomRouteProps;
//# sourceMappingURL=router.d.ts.map