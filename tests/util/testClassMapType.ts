import { TestCollection } from './testCollection';
import { TestCollectionView } from './TestCollectionView';
import { TestModel } from './testModel';
import { TestRouteView } from './testRouteView';
import { TestView } from './testView';

import { CollectionOptions } from '../../src/imports/collection';
import { CollectionViewOptions } from '../../src/imports/collectionView';
import { Attributes, ModelOptions } from '../../src/imports/model';
import { RouteViewOptions } from '../../src/imports/routeView';
import { ViewOptions } from '../../src/imports/view';

declare module '../../src/generated/ClassMapType' {
  interface ClassMapTypeModel {
    'test-model': { definition: typeof TestModel; options: ModelOptions<Attributes> };
  }

  interface ClassMapTypeView {
    'test-view': { definition: typeof TestView; options: ViewOptions };
  }

  interface ClassMapTypeCollection {
    'test-collection': { definition: typeof TestCollection; options: CollectionOptions };
  }

  interface ClassMapTypeCollectionView {
    'test-collection-view': { definition: typeof TestCollectionView; options: CollectionViewOptions };
  }

  interface ClassMapTypeRouteView {
    'test-route-view': { definition: typeof TestRouteView; options: RouteViewOptions };
  }
}
