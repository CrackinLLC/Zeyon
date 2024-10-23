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

interface ClassRegistryOptions extends EmitterOptions {
  registryClassList?: { [id: string]: ClassDefinition };
}

interface ClassMetadata {
  version?: string;
  // Additional metadata fields can be added here.
}

interface ClassEntry {
  classDef: ClassDefinition;
  metadata: ClassMetadata;
}

type ClassOptions =
  | EmitterOptions
  | RouterOptions
  | CollectionOptions
  | CollectionViewOptions<Collection<Model>, View>
  | ModelOptions
  | ViewOptions;

type ClassInstance = (Emitter | Router | Collection<Model> | CollectionView<Collection<Model>> | Model | View) & {
  options: ClassOptions;
};

interface ClassDefinition {
  new (...args: any[]): ClassInstance;
}

// A Controller class should not extend any class but the Emitter
interface ControllerDefinition {
  new (...args: any[]): Emitter;
}

export {
  ClassDefinition,
  ClassEntry,
  ClassInstance,
  ClassMetadata,
  ClassOptions,
  ClassRegistryOptions,
  ControllerDefinition,
};
