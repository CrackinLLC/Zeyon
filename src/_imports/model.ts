import { EmitterOptions } from '../../_imports/emitter';
import type { Attributes } from '../../util/attributes';
import type BaseModel from '../_baseModel';
import type BaseCollection from '../collection/_baseCollection';

export interface BaseModelOptions<A extends Attributes = Attributes> extends EmitterOptions {
  attributes?: A;
  collection?: BaseCollection<BaseModel<A>>;
}

export interface FetchCollectionOptions<C extends BaseCollection> {
  collectionProperty?: C | null;
  collectionName: string;
  idAttribute: string;
  force?: boolean;
}

export const enum ModelType {
  Agent = 'agent',
  Application = 'application',
  Document = 'document',
  Flow = 'flow',
  Lease = 'lease',
  Property = 'property',
  SessionUser = 'sessionUser',
  Step = 'step',
  Team = 'team',
  Tenant = 'tenant',
  Ticket = 'ticket',
  Todo = 'todo',
  User = 'user',
  Vendor = 'vendor',
  Unknown = 'unknown',
}
