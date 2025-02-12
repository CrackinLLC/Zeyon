import Emitter from './emitter';
import type { ZeyonAppLike } from './imports/app';
import type { NavigateOptions, RouteConfig, RouterOptions, SiteMapRouteConfig } from './imports/router';
import type RouteView from './routeView';
export default class Router extends Emitter {
    static registrationId: string;
    private currentPath;
    private currentRoute;
    private currentRouteConfig;
    private routes;
    private urlMap;
    private registrationIdMap;
    private siteMap;
    private root;
    private notFound;
    private urlPrefix;
    constructor({ urlPrefix, routes }: RouterOptions, app: ZeyonAppLike);
    registerRoutes(routes: RouteConfig[]): void;
    start(): void;
    getCurrentPath(): string;
    getCurrentRoute(): RouteView | undefined;
    getCurrentRouteConfig(): RouteConfig | undefined;
    getPathByRegistrationId(regId: string): string | undefined;
    getSiteMap(urlPath?: string): SiteMapRouteConfig | SiteMapRouteConfig[];
    setQueryParams(params: {
        [key: string]: string | null | undefined;
    }): void;
    navigateToRoot(): void;
    navigate({ route, toHome, force, preserveQuery, registrationId, }: NavigateOptions): Promise<void>;
    back(): void;
    private loadRouteFromUrl;
    private matchPathToRoute;
    private matchDynamicSegments;
    private standardizeUrl;
}
//# sourceMappingURL=router.d.ts.map