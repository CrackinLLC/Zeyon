import Zeyon from 'zeyon';
import { ClassMapTypeModel } from 'zeyon/imports';

export class TestCollection extends Zeyon.Collection {
  static registrationId = 'test-collection';

  modelRegistrationId: string & keyof ClassMapTypeModel = 'test-model';
}
