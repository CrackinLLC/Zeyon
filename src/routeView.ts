import { RouteViewOptions } from 'zeyon/imports';
import View from './view';

export default abstract class RouteView extends View {
  declare options: RouteViewOptions;
  declare defaultOptions: RouteViewOptions;

  static isRoute = true;

  /**
   * Used to allow a route to prevent the router from navigating, based on what this method returns
   * @param nextPath
   * @returns
   */
  async onBeforeNavigate(nextPath: string): Promise<boolean> {
    return !!nextPath || true;
  }
}
