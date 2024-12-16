import View from './view';
export default abstract class RouteView extends View {
    static registrationId: string;
    static isRoute: boolean;
    beforeNavigate(nextPath: string): Promise<boolean>;
}
//# sourceMappingURL=route.d.ts.map