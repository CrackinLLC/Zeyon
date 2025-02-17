import Zeyon, { ViewOptions } from 'zeyon';
import styles from '../styles/header.scss';

interface HeaderOptions extends ViewOptions {}

@Zeyon.registerView<HeaderOptions>('component-header', {
  styles,
  tagName: 'header',
})
export class Header extends Zeyon.View {
  protected async onRender() {
    this.app
      .newView('component-button', {
        label: 'Home',
        attachTo: this.el,
        onClick: () => {
          console.log('Clicked navigate: HOME');
          this.app.navigate({ route: '/' });
        },
      })
      .then((view) => view.render());
    this.app
      .newView('component-button', {
        label: 'About',
        attachTo: this.el,
        onClick: () => {
          console.log('Clicked navigate: ABOUT');
          this.app.navigate({ route: 'route-about', registrationId: true });
        },
      })
      .then((view) => view.render());
    this.app
      .newView('component-button', {
        label: 'Careers',
        attachTo: this.el,
        onClick: () => {
          console.log('Clicked navigate: Careers');
          this.app.navigate({ route: `about/career/${Math.ceil(Math.random() * 100)}` });
        },
      })
      .then((view) => view.render());

    this.app
      .newView('component-button', {
        label: 'Not Found',
        attachTo: this.el,
        onClick: () => {
          console.log('Clicked navigate: BAD LINK');
          this.app.navigate({ route: Zeyon.string.random({ len: 10 }) });
        },
      })
      .then((view) => view.render());
  }
}
