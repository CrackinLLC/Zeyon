// @ts-nocheck
import Zeyon from 'zeyon';

const name = 'My component name';


export class HeaderView_0K6EC5PQ extends Zeyon.View {
  protected async onRender() {
    console.log('HeaderView rendered!');
  }

    static registrationId = 'component-header';
    static template = `<div>Testing template literal with substitution: ${name} `;
    static isComponent = true;
}
