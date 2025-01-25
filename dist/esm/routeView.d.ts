import type { RouteViewOptions } from './imports/routeView';
import View from './view';
export default abstract class RouteView extends View {
    options: RouteViewOptions;
    defaultOptions: RouteViewOptions;
    static isRoute: boolean;
    beforeNavigate(nextPath: string): Promise<boolean>;
}
//# sourceMappingURL=routeView.d.ts.map