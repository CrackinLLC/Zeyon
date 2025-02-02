import Zeyon from 'zeyon';

@Zeyon.registerRouteView('route-about', {
  template: `<h2>About Us</h2><p>Welcome to the About Us page!</p>`,
})
class AboutRoute extends Zeyon.RouteView {
  protected async onRender() {
    console.log('About page rendered');
  }
}
