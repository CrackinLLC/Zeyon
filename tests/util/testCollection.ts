import Collection from '../../src/collection';
import { ClassMapTypeModel } from '../../src/generated/ClassMapType';

export class TestCollection extends Collection {
  static registrationId = 'test-collection';

  modelRegistrationId: keyof ClassMapTypeModel = 'test-model';
}
