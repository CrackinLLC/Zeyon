import {
  Attributes,
  CollectionOptions,
  CollectionViewOptions,
  ModelOptions,
  RouteViewOptions,
  ViewOptions,
} from 'zeyon/imports';
import { TestCollection } from './testCollection';
import { TestCollectionView } from './TestCollectionView';
import { TestModel } from './testModel';
import { TestRouteView } from './testRouteView';
import { TestView } from './testView';

declare module 'zeyon/maps' {
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
