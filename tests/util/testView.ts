import View from '../../src/view';

export class TestView extends View {
  static registrationId = 'test-view';

  protected ui = { testKey: 'my-selector' };

  template = '<div data-js="my-selector" id="match"></div>';
}
