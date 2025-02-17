import { RouteViewOptions } from 'zeyon/imports';
import View from './view';
export default abstract class RouteView extends View {
    options: RouteViewOptions;
    defaultOptions: RouteViewOptions;
    static isRoute: boolean;
    onBeforeNavigate(nextPath: string): Promise<boolean>;
}
//# sourceMappingURL=routeView.d.ts.map