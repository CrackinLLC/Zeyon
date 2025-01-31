// @ts-nocheck
import Zeyon from 'zeyon';


export class AboutRoute_SL19Z8G5 extends Zeyon.RouteView {
  protected async onRender() {
    console.log('About page rendered');
  }

    static registrationId = 'route-about';
    static template = `<h2>About Us</h2><p>Welcome to the About Us page!</p>`;
}
