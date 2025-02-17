import Zeyon from 'zeyon';
import { EmitterOptions } from 'zeyon/imports';
import { TestZeyonApp } from './testApp';

export class TestEmitter extends Zeyon.Emitter {
  static registrationId = 'test-emitter';

  constructor(options: EmitterOptions = {}, app: TestZeyonApp) {
    super(options, app);
  }

  public ready() {
    this.markAsReady();
  }
}
