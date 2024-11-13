import type HarnessApp from './app';
import Emitter from './emitter';
import { CollectionFilterDefinition, CollectionFilterOptions, CollectionLike, CollectionOptions } from './imports/collection';
import { Attributes, ModelType } from './imports/model';
import Model from './model';
export default abstract class Collection<A extends Attributes, M extends Model<any>> extends Emitter implements CollectionLike<A, M> {
    options: CollectionOptions;
    protected app: HarnessApp;
    protected abstract getModelClass(): typeof Model<A>;
    protected items: M[];
    length: number;
    protected visibleItems: M[];
    visibleLength: number;
    protected filterOptions: CollectionFilterOptions;
    protected activeFilters: {
        [key: string]: (item: M) => boolean;
    };
    constructor(options: CollectionOptions, app: HarnessApp);
    newModel(attributes: Partial<A> | Partial<A>[], silent?: boolean): Promise<this>;
    add(models: M | M[], silent?: boolean): this;
    remove(itemIds: number | number[] | undefined, silent?: boolean): M | M[] | undefined;
    getType(): ModelType;
    getItems(): M[];
    getAttributes(): object[];
    getAttributeKeys(): string[];
    getVisibleItems(): M[];
    getVisibleAttributes(): object[];
    getSelectedItems(includeHidden?: boolean): M[];
    getIds(): number[];
    getSelectedIds(): number[];
    findById(itemId: number): M | undefined;
    sort(compareFn: (a: M, b: M) => number): this;
    empty(): this;
    destroy(): void;
    filter(filterOptions?: CollectionFilterOptions, extend?: boolean): this;
    getFilterFunction(key: string, value: any): ((item: M) => boolean) | undefined;
    getFilterOptions(): CollectionFilterDefinition[];
    protected applyFilters(): this;
    clearFilters(): this;
    protected getTextSearchAttributes(): string[];
}
//# sourceMappingURL=collection.d.ts.map