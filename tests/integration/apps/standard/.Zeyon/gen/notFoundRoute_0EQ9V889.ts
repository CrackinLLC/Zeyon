// @ts-nocheck
import Zeyon from 'zeyon';
import notFoundTemplate from '../../src/templates/notFound.hbs';

// @Zeyon.registerRouteView<{test: string} extends RouteViewOptions>('route-notfound', {

export class notFoundRoute_0EQ9V889 extends Zeyon.RouteView {
  protected async onRender() {
    console.log('notFound page rendered');
  }

    static registrationId = 'route-notfound';
    static template = notFoundTemplate;
}
