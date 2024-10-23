import type Collection from '../collection';
import type CollectionView from '../collectionView';
import type Emitter from '../emitter';
import type { CollectionOptions } from '../imports/collection';
import type { CollectionViewOptions } from '../imports/collectionView';
import type { EmitterOptions } from '../imports/emitter';
import type { ModelOptions } from '../imports/model';
import type { RouterOptions } from '../imports/router';
import type { ViewOptions } from '../imports/view';
import type Model from '../model';
import type Router from '../router';
import type View from '../view';

export interface ClassRegistryOptions extends EmitterOptions {
  registryClassList?: { [id: string]: ClassDefinition };
}

export interface ClassMetadata {
  version?: string;
  // Additional metadata fields can be added here.
}

export interface ClassEntry {
  classDef: ClassDefinition;
  metadata: ClassMetadata;
}

type ClassInstance = (Emitter | Router | Collection<Model> | CollectionView<Collection<Model>> | Model | View) & {
  options: ClassOptions;
};

type ClassOptions =
  | EmitterOptions
  | RouterOptions
  | CollectionOptions
  | CollectionViewOptions<Collection<Model>, View>
  | ModelOptions
  | ViewOptions;

interface ClassDefinition {
  new (...args: any[]): ClassInstance;
}

// A Controller class should not extend any class but the Emitter
interface ControllerDefinition {
  new (...args: any[]): Emitter;
}

export {
  ClassDefinition,
  ClassInstance,
  ClassOptions,
  Collection,
  CollectionOptions,
  CollectionView,
  CollectionViewOptions,
  ControllerDefinition,
  Emitter,
  EmitterOptions,
  Model,
  ModelOptions,
  Router,
  RouterOptions,
  View,
  ViewOptions,
};
