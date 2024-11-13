import type Emitter from '../emitter';
import type { Attributes, ModelType } from '../imports/model';
import type Model from '../model';
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
export interface CollectionLike<A extends Attributes = Attributes, M extends Model<A> = Model<A>> extends Emitter {
    length: number;
    visibleLength: number;
    isReady: Promise<this>;
    newModel(attributes: Partial<{}> | Partial<{}>[], silent?: boolean): Promise<this>;
    add(models: M | M[], silent: boolean): this;
    remove(itemIds: number | number[] | undefined, silent?: boolean): M | M[] | undefined;
    getType(): ModelType;
    getItems(): M[];
    getAttributes(): object[];
    getAttributeKeys(): string[];
    getVisibleItems(): M[];
    getVisibleAttributes(): object[];
    getSelectedItems(): M[];
    getIds(): number[];
    getSelectedIds(): number[];
    findById(itemId: number): M | undefined;
    sort(compareFn: (a: M, b: M) => number): void;
    empty(): void;
    filter(filterOptions?: any, extend?: boolean): void;
    getFilterFunction(key: string, value: any): ((item: M) => boolean) | undefined;
    getFilterOptions(): CollectionFilterDefinition[];
}
export declare const collectionEvents: string[];
//# sourceMappingURL=collection.d.ts.map