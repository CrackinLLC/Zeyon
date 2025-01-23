import { ClassMapTypeModel } from '../../src/_index.d';
import Collection from '../../src/collection';

export class TestCollection extends Collection {
  static registrationId = 'test-collection';

  modelRegistrationId: keyof ClassMapTypeModel = 'test-model';
}
