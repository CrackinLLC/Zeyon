import Zeyon from 'zeyon';
import template from '../templates/header.hbs';

@Zeyon.registerView('component-header', { template })
export class HeaderView extends Zeyon.View {
  static isComponent = true;

  protected async onRender() {
    console.log('HeaderView rendered!');
  }
}
