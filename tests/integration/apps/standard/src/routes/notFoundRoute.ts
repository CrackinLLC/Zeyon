import Zeyon from 'zeyon';
import notFoundTemplate from '../templates/notFound.hbs';

// @Zeyon.registerRouteView<{test: string} extends RouteViewOptions>('route-notfound', {
@Zeyon.registerRouteView('route-notfound', {
  template: notFoundTemplate,
})
export class notFoundRoute extends Zeyon.RouteView {
  protected async onRender() {
    console.log('notFound page rendered');
  }
}
