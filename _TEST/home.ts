import RouteView from '../src/route';
import HomePageTemplate from './templates/home.hbs';

export default class HomePageRoute extends RouteView {
  static isComponent = false;

  protected template = HomePageTemplate;
  protected ui = {};

  protected async onRender() {
    console.log('HomePage page rendered!');
  }
}
