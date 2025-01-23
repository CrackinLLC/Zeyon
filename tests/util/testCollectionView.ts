import { ClassMapTypeView } from '../../src/_index.d';
import CollectionView from '../../src/collectionView';

export class TestCollectionView extends CollectionView {
  static registrationId = 'test-collection-view';

  modelViewRegistrationId: keyof ClassMapTypeView = 'test-view';
}
