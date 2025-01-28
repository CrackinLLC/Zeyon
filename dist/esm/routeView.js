import View from './view';
class RouteView extends View {
    async onBeforeNavigate(nextPath) {
        return !!nextPath || true;
    }
}
RouteView.isRoute = true;
export default RouteView;
//# sourceMappingURL=routeView.js.map