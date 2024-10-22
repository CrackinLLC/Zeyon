import View from '../src/view';
import HomePageTemplate from './templates/home.hbs';

export default class HomePageRoute extends View {
  static isComponent = false;

  protected template = HomePageTemplate;
  protected ui = {};

  protected async onRender() {
    console.log('HomePage page rendered!');
  }
}
