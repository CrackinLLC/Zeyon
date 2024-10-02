import type { CollectionOptions } from "../_imports/collection";
import type { CollectionViewOptions } from "../_imports/collectionView";
import type { ModelOptions } from "../_imports/model";
import type { ViewOptions } from "../_imports/view";
import type Collection from "../collection";
import type CollectionView from "../collectionView";
import type Emitter from "../emitter";
import type Model from "../model";
import type View from "../view";

type BinaryClass =
  | Emitter
  | View
  | Model
  | Collection<Model>
  | CollectionView<Collection<Model>>;

type BinaryOptions =
  | ModelOptions
  | CollectionOptions
  | ViewOptions
  | CollectionViewOptions<Collection<Model>>;

interface BinaryClassDefinition {
  new (...args: any[]): BinaryClass;
}

// All Controller classes should not extend any class other than the Emitter
interface ControllerDefinition {
  new (...args: any[]): Emitter;
}

const enum AttributeType {
  String = "String",
  Number = "Number",
  Boolean = "Boolean",
  Date = "Date",
  ArrayString = "ArrayString",
  ArrayNumber = "ArrayNumber",
  ArrayObject = "ArrayObject",
  Object = "Object",
}

interface AttributeDefinition {
  type: AttributeType;
  default?: unknown; // Default value when creating a new model
  optional?: boolean;
}

/////////////////////////////
// Common attribute types

interface BankingDetails {
  // Pending...
}

const enum Priority {
  Low,
  Medium,
  High,
  Critical,
}

interface Note {
  user_id: number;
  message: string;
  created_on: string;
}

export {
  AttributeDefinition,
  AttributeType,
  BankingDetails,
  BinaryClass,
  BinaryClassDefinition,
  BinaryOptions,
  Collection,
  CollectionView,
  ControllerDefinition,
  Model,
  Note,
  Priority,
  View,
};
