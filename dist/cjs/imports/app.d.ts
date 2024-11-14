import type { ClassDefinition } from './classRegistry';
import type { RouteConfig } from './router';
export interface ZeyonAppOptions<CustomRouteProps = any> {
    name?: string;
    el: HTMLElement;
    urlPrefix: string;
    routes: RouteConfig<CustomRouteProps>[];
    registryClassList: Record<string, ClassDefinition>;
}
//# sourceMappingURL=app.d.ts.map