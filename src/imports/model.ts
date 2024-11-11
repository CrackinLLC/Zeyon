import type Model from '../model';
import { EmitterOptions } from './emitter';

export interface ModelOptions<A extends Record<string, any>> extends EmitterOptions {
  attributes?: Partial<A>;
}

export const enum ModelType {
  Unknown = 'unknown',
}

/**
 * Helper for getting the attribute type of a model without exposing its attribute property
 */
export type AttributesOf<M extends Model<any>> = M extends Model<infer A> ? A : never;

/////////////////////////
// Attribute interfaces

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
