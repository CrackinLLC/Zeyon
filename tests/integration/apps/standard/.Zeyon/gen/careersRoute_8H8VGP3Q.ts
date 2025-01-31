// @ts-nocheck
import Zeyon from 'zeyon';
import careersTemplate from '../../src/templates/careers.hbs';


export class CareersRoute_8H8VGP3Q extends Zeyon.RouteView {
  protected async onRender() {
    console.log('Careers page rendered', { options: this.options });
  }

    static registrationId = 'route-careers';
    static template = careersTemplate;
}
