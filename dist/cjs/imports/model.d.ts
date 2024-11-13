import type Collection from '../collection';
import type Model from '../model';
import { EmitterOptions } from './emitter';
export interface ModelOptions<A extends Attributes = Attributes> extends EmitterOptions {
    attributes?: Partial<A>;
    collection?: Collection<A, any>;
}
export declare const enum ModelType {
    Unknown = "unknown"
}
export interface Attributes {
    [key: string]: unknown;
    id?: number;
}
export declare const enum AttributeType {
    String = "String",
    StringArray = "StringArray",
    Number = "Number",
    NumberArray = "NumberArray",
    Object = "Object",
    ObjectArray = "ObjectArray",
    Boolean = "Boolean",
    Date = "Date"
}
export interface AttributeDefinition {
    type: AttributeType;
    default?: unknown;
    optional?: boolean;
}
export type AttributesOf<M extends Model<any>> = M extends Model<infer A> ? A : never;
export declare const modelEvents: string[];
//# sourceMappingURL=model.d.ts.map