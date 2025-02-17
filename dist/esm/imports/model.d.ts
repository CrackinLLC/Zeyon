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
export type AttributeType = 'string' | 'stringArray' | 'number' | 'numberArray' | 'boolean' | 'booleanArray' | 'symbol' | 'symbolArray' | 'object' | 'objectArray' | 'date' | 'dateArray';
export interface AttributeDefinition {
    type: AttributeType;
    default?: unknown;
    isDefaultSortKey?: boolean;
    optional?: boolean;
    allowed?: unknown[];
    validate?: (val: unknown) => boolean;
    minLength?: number;
    maxLength?: number;
}
//# sourceMappingURL=model.d.ts.map