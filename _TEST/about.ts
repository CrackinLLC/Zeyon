import View from '../src/view';
import AboutPageTemplate from './templates/about.hbs';

export default class AboutPageScreen extends View {
  static isComponent = false;

  protected template = AboutPageTemplate;
  protected ui = {};

  protected async onRender() {
    console.log('About page rendered!');
  }
}
