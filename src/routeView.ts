import type { RouteViewOptions } from './imports/routeView';
import View from './view';

export default abstract class RouteView extends View {
  declare options: RouteViewOptions;
  declare defaultOptions: RouteViewOptions;

  static isRoute = true; // TODO: Is this needed? Maybe just check that class type is RouteView instead

  /**
   * Used to allow a route to prevent the router from navigating, based on what this method returns
   * @param nextPath
   * @returns
   */
  async beforeNavigate(nextPath: string): Promise<boolean> {
    return !!nextPath || true;
  }
}
