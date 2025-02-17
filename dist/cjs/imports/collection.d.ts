import { EmitterOptions } from 'zeyon/imports';
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
//# sourceMappingURL=collection.d.ts.map