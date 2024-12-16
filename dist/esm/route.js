import View from './view';
class RouteView extends View {
    async beforeNavigate(nextPath) {
        return !!nextPath || true;
    }
}
RouteView.registrationId = 'zeyon-route';
RouteView.isRoute = true;
export default RouteView;
//# sourceMappingURL=route.js.map