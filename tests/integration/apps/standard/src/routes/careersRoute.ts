import Zeyon from 'zeyon';
import careersTemplate from '../templates/careers.hbs';

@Zeyon.registerRouteView('route-careers', {
  template: careersTemplate,
})
export class CareersRoute extends Zeyon.RouteView {
  protected async onRender() {
    console.log('Careers page rendered', { options: this.options });
  }
}
