import type BaseModel from "../model/_baseModel";
import type { BaseModelOptions } from "../model/_imports/_baseModel";
import type BaseCollection from "../model/collection/_baseCollection";
import type { BaseCollectionOptions } from "../model/collection/_imports/_baseCollection";
import type Emitter from "../src/emitter";
import type BaseView from "../view/_baseView";
import type { BaseViewOptions } from "../view/_imports/_baseView";
import type BaseCollectionView from "../view/collection/_baseCollectionView";
import type { BaseCollectionViewOptions } from "../view/collection/_imports/_baseCollectionView";

type BinaryClass =
  | Emitter
  | BaseView
  | BaseModel
  | BaseCollection<BaseModel>
  | BaseCollectionView<BaseCollection<BaseModel>>;

type BinaryOptions =
  | BaseModelOptions
  | BaseCollectionOptions
  | BaseViewOptions
  | BaseCollectionViewOptions<BaseCollection<BaseModel>>;

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
  BaseCollection,
  BaseCollectionView,
  BaseModel,
  BaseView,
  BinaryClass,
  BinaryClassDefinition,
  BinaryOptions,
  ControllerDefinition,
  Note,
  Priority,
};
