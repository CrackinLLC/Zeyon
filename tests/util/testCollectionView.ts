import CollectionView from '../../src/collectionView';
import { ClassMapTypeView } from '../../src/generated/ClassMapType';

export class TestCollectionView extends CollectionView {
  static registrationId = 'test-collection-view';

  modelViewRegistrationId: keyof ClassMapTypeView = 'test-view';
}
