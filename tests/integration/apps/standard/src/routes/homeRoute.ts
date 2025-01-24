import Zeyon from 'zeyon';
import homeTemplate from '../templates/home.hbs';

@Zeyon.registerRouteView('route-home', {
  template: homeTemplate,
})
export class HomeRoute extends Zeyon.RouteView {
  protected async onRender() {
    console.log('Home page rendered');
  }
}
