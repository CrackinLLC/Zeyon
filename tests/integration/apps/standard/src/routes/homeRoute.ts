import Zeyon from 'zeyon';
import { HomeRouteOptions } from '../interfaces/homeRouteOptions';
import homeTemplate from '../templates/home.hbs';

@Zeyon.registerRouteView<HomeRouteOptions>('route-home', {
  template: homeTemplate,
})
export class HomeRoute extends Zeyon.RouteView {
  protected async onRender() {
    console.log('Home page rendered');
  }
}
