import type ZeyonApp from './app';
import Emitter from './emitter';
import type { RouteConfig, RouterOptions, SiteMapRouteDetail } from './imports/router';
import type RouteView from './routeView';
export default class Router<CustomRouteProps = any> extends Emitter {
    static registrationId: string;
    private currentPath;
    private currentRoute;
    private currentRouteConfig;
    private routes;
    private notFound;
    private urlMap;
    private siteMap;
    private urlPrefix;
    constructor({ urlPrefix }: RouterOptions, app: ZeyonApp);
    registerRoutes<C extends CustomRouteProps>(routes: RouteConfig<C>[]): void;
    start(): void;
    getCurrentPath(): string;
    getCurrentRoute(): RouteView | undefined;
    getCurrentRouteConfig(): RouteConfig<CustomRouteProps> | undefined;
    getSiteMap(options?: {
        exclude?: Partial<CustomRouteProps>;
    }): SiteMapRouteDetail<CustomRouteProps>[];
    setQueryParams(params: {
        [key: string]: string | null | undefined;
    }): void;
    navigate({ path, preserveQuery, force, }: {
        path?: string;
        preserveQuery?: boolean;
        force?: boolean;
    }): Promise<void>;
    back(): void;
    private loadRouteFromUrl;
    private matchPathToRoute;
    private preprocessRoutes;
    private standardizeUrl;
}
//# sourceMappingURL=router.d.ts.map