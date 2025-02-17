import {
  Attributes,
  CollectionOptions,
  CollectionViewOptions,
  ModelOptions,
  RouteViewOptions,
  ViewOptions,
} from 'zeyon/imports';
import type Collection from './collection';
import type ColectionView from './collectionView';
import type Model from './model';
import type RouteView from './routeView';
import type View from './view';

export interface ClassMapTypeModel {
  [registrationId: string]: { classRef: typeof Model; options: ModelOptions<Attributes> };
}

export interface ClassMapTypeCollection {
  [registrationId: string]: { classRef: typeof Collection; options: CollectionOptions };
}

export interface ClassMapTypeView {
  [registrationId: string]: { classRef: typeof View; options: ViewOptions };
}

export interface ClassMapTypeRouteView {
  [registrationId: string]: { classRef: typeof RouteView; options: RouteViewOptions };
}

export interface ClassMapTypeCollectionView {
  [registrationId: string]: { classRef: typeof ColectionView; options: CollectionViewOptions };
}

export type ClassMapKey = string &
  (
    | keyof ClassMapTypeView
    | keyof ClassMapTypeRouteView
    | keyof ClassMapTypeModel
    | keyof ClassMapTypeCollection
    | keyof ClassMapTypeCollectionView
  );
