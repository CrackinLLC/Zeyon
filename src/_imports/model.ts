import type Collection from "../collection";
import type Model from "../model";
import type { Attributes } from "../util/attributes";
import { EmitterOptions } from "./emitter";

export interface ModelOptions<A extends Attributes = Attributes>
  extends EmitterOptions {
  attributes?: A;
  collection?: Collection<Model<A>>;
}

export interface FetchCollectionOptions<C extends Collection> {
  collectionProperty?: C | null;
  collectionName: string;
  idAttribute: string;
  force?: boolean;
}

export const enum ModelType {
  Agent = "agent",
  Application = "application",
  Document = "document",
  Flow = "flow",
  Lease = "lease",
  Property = "property",
  SessionUser = "sessionUser",
  Step = "step",
  Team = "team",
  Tenant = "tenant",
  Ticket = "ticket",
  Todo = "todo",
  User = "user",
  Vendor = "vendor",
  Unknown = "unknown",
}
