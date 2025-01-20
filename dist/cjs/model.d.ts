import type Collection from './collection';
import Emitter from './emitter';
import { ZeyonAppLike } from './imports/app';
import { AttributeDefinition, Attributes, ModelOptions } from './imports/model';
export default abstract class Model extends Emitter {
    protected app: ZeyonAppLike;
    abstract attrib: Attributes;
    options: ModelOptions<this['attrib']>;
    defaultOptions: ModelOptions<this['attrib']>;
    static definition: {
        [key: string]: AttributeDefinition;
    };
    protected attributes: this['attrib'];
    protected attributesOriginal: this['attrib'];
    protected hasUnsavedChanges: boolean;
    protected selected: boolean;
    private collection;
    constructor(options: ModelOptions<Attributes>, app: ZeyonAppLike);
    protected markUnsavedChanges(): this;
    protected areAttributesEqual(a: Partial<this['attrib']>, b: Partial<this['attrib']>): boolean;
    hasChanges(): boolean;
    set(attributes?: Partial<this['attrib']>, silent?: boolean): this;
    unset(attributeName: keyof this['attrib']): this;
    get<K extends keyof this['attrib']>(attributeName: K): this['attrib'][K];
    getId(): number | undefined;
    getAttributes(): this['attrib'];
    setCollection(collection?: Collection): this;
    getCollection(): Collection | null;
    select(selected: boolean): this;
    isSelected(): boolean;
    reset(silent?: boolean): this;
    destroy(): void;
    validateAttributes(attributes: Partial<this['attrib']>): Partial<this['attrib']>;
    static getAttributeKeys(): string[];
}
//# sourceMappingURL=model.d.ts.map