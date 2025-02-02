import Zeyon from 'zeyon';
import { ButtonOptions } from '../interfaces/buttonOptions';
import styles from '../styles/button.scss';
import template from '../templates/button.hbs';

@Zeyon.registerView<ButtonOptions>('component-button', {
  template,
  styles,
  ui: {
    test: 'test',
  },
  tagName: 'button',
  isComponent: true,
})
export class Button extends Zeyon.View {
  protected async onRender() {
    // @ts-ignore
    this.on('click', this.options.onClick);
  }
}
