import RouteView from '../src/route';
import NotFoundTemplate from './templates/404.hbs';

export default class NotFoundRoute extends RouteView {
  static isComponent = false;

  protected template = NotFoundTemplate;
  protected ui = {};

  protected async onRender() {
    console.log('NotFound page rendered!');
  }
}
