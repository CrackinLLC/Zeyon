import type Collection from './collection';
import type ColectionView from './collectionView';
import type Model from './model';
import type RouteView from './routeView';
import type View from './view';

import { CollectionOptions } from './imports/collection';
import { CollectionViewOptions } from './imports/collectionView';
import { Attributes, ModelOptions } from './imports/model';
import { RouteViewOptions } from './imports/routeView';
import { ViewOptions } from './imports/view';

declare module '*.hbs';

export interface ClassMapTypeModel {
  [registrationId: string]: { definition: typeof Model; options: ModelOptions<Attributes> };
}

export interface ClassMapTypeCollection {
  [registrationId: string]: { definition: typeof Collection; options: CollectionOptions };
}

export interface ClassMapTypeView {
  [registrationId: string]: { definition: typeof View; options: ViewOptions };
}

export interface ClassMapTypeRouteView {
  [registrationId: string]: { definition: typeof RouteView; options: RouteViewOptions };
}

export interface ClassMapTypeCollectionView {
  [registrationId: string]: { definition: typeof ColectionView; options: CollectionViewOptions };
}

export type ClassMapKey =
  | keyof ClassMapTypeView
  | keyof ClassMapTypeRouteView
  | keyof ClassMapTypeModel
  | keyof ClassMapTypeCollection
  | keyof ClassMapTypeCollectionView;
