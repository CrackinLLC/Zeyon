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

  'model:change', // When any model attribute is changed.
  'model:reset', // When all model attributes are reset to their default or undefined values.
  'model:selected', // When the model is selected or deselected.

  // 'save', // When the collection of model records have been successfully been saved to the server.
  // 'fetch', // When the collection of model records have been successfully been fetched from the server.
  // 'delete', // When the collection of model records have been successfully been deleted from the server.
];
