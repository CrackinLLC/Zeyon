import Emitter from '../../src/emitter';
import type { EmitterOptions } from '../../src/imports/emitter';
import { TestZeyonApp } from './testApp';

export class TestEmitter extends Emitter {
  static registrationId = 'test-emitter';

  constructor(options: EmitterOptions = {}, app: TestZeyonApp) {
    super(options, app);
  }

  public ready() {
    this.markAsReady();
  }
}
