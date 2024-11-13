import View from './view';
export default class RouteView extends View {
    async beforeNavigate(nextPath) {
        return !!nextPath || true;
    }
}
RouteView.isRoute = true;
//# sourceMappingURL=route.js.map