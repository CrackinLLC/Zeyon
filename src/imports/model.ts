import type Collection from '../collection';
import type Model from '../model';
import { EmitterOptions } from './emitter';

export interface ModelOptions<A extends Record<string, any> = {}, Self extends Model<A, Self> = any>
  extends EmitterOptions {
  definitions: { [key in keyof A]: AttributeDefinition };
  attributes?: Partial<A>;
  collection?: Collection<Self>;
}

export const enum ModelType {
  Unknown = 'unknown',
}

export const enum AttributeType {
  String = 'String',
  StringArray = 'StringArray',
  Number = 'Number',
  NumberArray = 'NumberArray',
  Object = 'Object',
  ObjectArray = 'ObjectArray',
  Boolean = 'Boolean',
  Date = 'Date',
}

export interface AttributeDefinition {
  type: AttributeType;
  default?: unknown; // Default value of the attribute when a new model is instantiated
  optional?: boolean;
}
