import type { ClassMapTypeCollection } from 'zeyon/_maps';
import type Collection from '../collection';
import type { ViewOptions } from './view';

export interface CollectionViewOptions extends ViewOptions {
  collection?: Collection;
  collectionRegistrationId?: string & keyof ClassMapTypeCollection;
  collectionOptions?: unknown;
  modelViewOptions?: unknown;
}

export const collectionViewEvents = [
  'collection:update', // When the collection is updated.
  'collection:filter', // When the collection is filtered.
  'collection:sort', // When the collection is sorted.
];
