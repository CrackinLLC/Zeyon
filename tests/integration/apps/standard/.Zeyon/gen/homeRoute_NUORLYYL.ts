// @ts-nocheck
import Zeyon, { RouteViewOptions } from 'zeyon';
import homeTemplate from '../../src/templates/home.hbs';

interface HomeRouteOptions extends RouteViewOptions {
  test: string;
}


export class HomeRoute_NUORLYYL extends Zeyon.RouteView {
  protected async onRender() {
    console.log('Home page rendered');
  }

    static registrationId = 'route-home';
    static template = homeTemplate;
    declare options: HomeRouteOptions;
}
