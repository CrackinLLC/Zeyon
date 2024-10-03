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

type BinaryClass = (Emitter | Router | Collection<Model> | CollectionView<Collection<Model>> | Model | View) & {
  options: BinaryClassOptions;
};

type BinaryClassOptions =
  | EmitterOptions
  | RouterOptions
  | CollectionOptions
  | CollectionViewOptions<Collection<Model>, View>
  | ModelOptions
  | ViewOptions;

interface BinaryClassDefinition {
  new (...args: any[]): BinaryClass;
}

// A Controller class should not extend any class other than the Emitter
interface ControllerDefinition {
  new (...args: any[]): Emitter;
}

export {
  BinaryClass,
  BinaryClassDefinition,
  BinaryClassOptions,
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
