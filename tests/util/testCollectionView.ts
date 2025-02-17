import Zeyon from 'zeyon';
import { ClassMapTypeView } from 'zeyon/imports';

export class TestCollectionView extends Zeyon.CollectionView {
  static registrationId = 'test-collection-view';

  modelViewRegistrationId: string & keyof ClassMapTypeView = 'test-view';
}
