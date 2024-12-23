import type { EmitterOptions } from './emitter';

export interface CollectionOptions extends EmitterOptions {
  ids?: number[];
}

export interface CollectionFilterOptions {
  [key: string]: unknown;
  text?: string;
}

export interface CollectionFilterDefinition {
  key: string;
  name: string;
  values?: string[];
  textInput?: boolean;
}

export const collectionEvents = [
  'update', // When any models are added, removed, or changed.
  'sort', // When the collection is sorted.
  'filter', // When the collection has a filter applied.
  'fetch', // When a fetch request is made to the server.
  'save', // When the collection of data objects has been successfully been saved to the server.
];
