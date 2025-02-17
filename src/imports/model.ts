import { EmitterOptions } from 'zeyon/imports';
import type Collection from '../collection';

export interface ModelOptions<A extends Attributes> extends EmitterOptions {
  attributes?: Partial<A>;
  collection?: Collection;
}

export interface Attributes {
  [key: string]: unknown;
  id?: number;
}

export type AttributeType =
  | 'string'
  | 'stringArray'
  | 'number'
  | 'numberArray'
  | 'boolean'
  | 'booleanArray'
  | 'symbol'
  | 'symbolArray'
  | 'object'
  | 'objectArray'
  | 'date'
  | 'dateArray';

export interface AttributeDefinition {
  type: AttributeType;
  default?: unknown; // The default value of the attribute when a new instance is created.

  // TODO: Include logic to ensure only one attribute is marked as the default sorting key.
  isDefaultSortKey?: boolean; // Should sort on this attribute by default, in a collection
  optional?: boolean; // Flags undefined or null as valid values (Defaults to false).
  allowed?: unknown[]; // An array of explicitly permitted values. Does not infringe on "optional" handling.
  validate?: (val: unknown) => boolean; // Custom validation function.

  minLength?: number; // Minimum length for strings and arrays.
  maxLength?: number; // Maximum length for strings and arrays.
}
