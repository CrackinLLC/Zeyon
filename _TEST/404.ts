import View from '../src/view';
import NotFoundTemplate from './templates/404.hbs';

export default class NotFoundRoute extends View {
  static isComponent = false;

  protected template = NotFoundTemplate;
  protected ui = {};

  protected async onRender() {
    console.log('NotFound page rendered!');
  }
}
