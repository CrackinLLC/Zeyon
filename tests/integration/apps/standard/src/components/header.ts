import Zeyon from 'zeyon';
import styles from '../styles/header.scss';

@Zeyon.registerView('component-header', {
  styles,
  tagName: 'header',
})
export class Header extends Zeyon.View {
  protected async onRender() {
    this.app
      .newView('component-button', {
        // @ts-ignore
        label: 'Home',
        attachTo: this.el,
        onClick: () => {
          console.log('Navigating: HOME');
          this.app.navigate('/');
        },
      })
      .then((view) => view.render());
    this.app
      .newView('component-button', {
        // @ts-ignore
        label: 'About',
        attachTo: this.el,
        onClick: () => {
          console.log('Navigating: ABOUT');
          this.app.navigate('about');
        },
      })
      .then((view) => view.render());
    this.app
      .newView('component-button', {
        // @ts-ignore
        label: 'Careers',
        attachTo: this.el,
        onClick: () => {
          console.log('Navigating: Careers');
          this.app.navigate(`career/${Math.ceil(Math.random() * 100)}`);
        },
      })
      .then((view) => view.render());

    this.app
      .newView('component-button', {
        // @ts-ignore
        label: 'Not Found',
        attachTo: this.el,
        onClick: () => {
          console.log('Navigating: BAD LINK');
          this.app.navigate('badlink');
        },
      })
      .then((view) => view.render());
  }
}
