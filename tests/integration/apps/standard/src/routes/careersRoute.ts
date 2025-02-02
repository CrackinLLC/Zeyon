import Zeyon, { RouteViewOptions } from 'zeyon';
import styles from '../styles/careers.scss';
import careersTemplate from '../templates/careers.hbs';

interface CareersRouteOptions extends RouteViewOptions {
  careersTest: string;
}

@Zeyon.registerRouteView<CareersRouteOptions>('route-careers', {
  template: careersTemplate,
  styles,
})
class CareersRoute extends Zeyon.RouteView {
  protected async onRender() {
    console.log('Careers page rendered', { options: this.options });
  }
}

export { CareersRoute };
