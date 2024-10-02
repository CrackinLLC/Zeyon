import type { ModelType } from "../_imports/model";
import type Emitter from "../emitter";
import type Model from "../model";
import type { Attributes } from "../util/attributes";
import type { EmitterOptions } from "./emitter";

export interface CollectionFilterOptions {
  text?: string;
}

export interface CollectionFilterDefinition {
  key: string;
  name: string;
  values?: string[];
  textInput?: boolean;
}

export interface CollectionOptions extends EmitterOptions {
  ids?: string[];
  fetchAllData?: boolean;
  filter?: CollectionFilterOptions;
}

export interface CollectionLike<M extends Model = Model> extends Emitter {
  model: M;
  attributeDefinition: M["attributeDefinition"];

  filterOptions: CollectionFilterOptions;

  length: number;
  visibleLength: number;
  isReady: Promise<any>;
  isDestroyed: boolean;

  newModel(
    attributes: Partial<Attributes> | Partial<Attributes>[],
    silent?: boolean
  ): Promise<this>;
  add(items: M | M[], silent?: boolean): CollectionLike<M>;
  remove(
    itemIds: number | number[] | undefined,
    silent?: boolean
  ): M | M[] | undefined;
  getType(): ModelType;
  getItems(): M[];
  getAttributes(): object[];
  getAttributeKeys(): string[];
  getVisibleItems(): M[];
  getVisibleAttributes(): object[];
  getSelectedItems(): M[];
  getIds(): number[];
  getSelectedIds(): number[];
  findById(itemId: number): M | undefined;
  sort(compareFn: (a: M, b: M) => number): void;
  empty(): void;
  save(): Promise<void>;
  fetch(): Promise<void>;
  fetchAll(silent?: boolean): Promise<void>;
  destroy(): void;

  filter(filterOptions?: any, extend?: boolean): void;
  getFilterFunction(
    key: string,
    value: any
  ): ((item: M) => boolean) | undefined;
  getFilterOptions(): CollectionFilterDefinition[];
}

export const collectionEvents = [
  "update", // When any models are added, removed, or changed.
  "sort", // When the collection is sorted.
  "filter", // When the collection has a filter applied.
  "fetch", // When a fetch request is made to the server.
  "save", // When the collection of data objects has been successfully been saved to the server.
  "destroyed", // When the collection has been destroyed.
];
