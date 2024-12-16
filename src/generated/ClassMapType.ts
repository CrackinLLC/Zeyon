import type Collection from '../collection';
import type ColectionView from '../collectionView';
import type { Attributes } from '../imports/model';
import type Model from '../model';
import type RouteView from '../routeView';
import type View from '../view';

export interface ClassMapTypeView {
  [key: string]: View;
}

export interface ClassMapTypeRouteView {
  [key: string]: RouteView;
}

export interface ClassMapTypeModel {
  [key: string]: Model<Attributes>;
}

export interface ClassMapTypeCollection {
  [key: string]: Collection<Attributes, Model<Attributes>>;
}

export interface ClassMapTypeCollectionView {
  [key: string]: ColectionView;
}

export type ClassMapKey =
  | keyof ClassMapTypeView
  | keyof ClassMapTypeRouteView
  | keyof ClassMapTypeModel
  | keyof ClassMapTypeCollection
  | keyof ClassMapTypeCollectionView;
