import Zeyon from 'zeyon';

const name = 'My component name';

@Zeyon.registerView('component-header', {
  template: `
    <div>Testing template literal with substitution: ${name}
      <span class="thing" data-js="test">TESTING</span>
    </div>`,
  styles: `
    .thing {
      display: block;
      margin: 20px;
      background-color: blue;
    }
  `,
  ui: {
    test: 'test',
  },
  isComponent: true,
})
export class HeaderView extends Zeyon.View {
  protected async onRender() {
    console.log('HeaderView rendered!', this);
  }
}
