import RouteView from '../src/route';
import CareersPageTemplate from './templates/careers.hbs';

export default class CareersPageRoute extends RouteView {
  static isComponent = false;

  protected template = CareersPageTemplate;
  protected ui = {};

  protected async onRender() {
    console.log('Careers page rendered!');
  }
}
