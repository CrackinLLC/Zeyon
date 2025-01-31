import Zeyon, { RouteViewOptions } from 'zeyon';
import homeTemplate from '../templates/home.hbs';

interface HomeRouteOptions extends RouteViewOptions {
  test: string;
}

@Zeyon.registerRouteView<HomeRouteOptions>('route-home', {
  template: homeTemplate,
})
export class HomeRoute extends Zeyon.RouteView {
  protected async onRender() {
    console.log('Home page rendered');
  }
}
