import Zeyon from 'zeyon';

export class TestView extends Zeyon.View {
  static registrationId = 'test-view';
  static ui = { testKey: 'my-selector' };
  static template = '<div data-js="my-selector" id="match"></div>';
}
