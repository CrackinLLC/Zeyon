import type Collection from '../collection';
import type Model from '../model';
import { EmitterOptions } from './emitter';

export interface ModelOptions<A extends Record<string, any> = {}, Self extends Model<A, Self> = any>
  extends EmitterOptions {
  attributes?: Partial<A>;
  collection?: Collection<Self>;
}

export const enum ModelType {
  Unknown = 'unknown',
}
