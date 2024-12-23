import type { EmitterOptions } from './emitter';
export interface CollectionOptions extends EmitterOptions {
    ids?: number[];
}
export interface CollectionFilterOptions {
    [key: string]: unknown;
    text?: string;
}
export interface CollectionFilterDefinition {
    key: string;
    name: string;
    values?: string[];
    textInput?: boolean;
}
export declare const collectionEvents: string[];
//# sourceMappingURL=collection.d.ts.map