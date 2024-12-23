import type ZeyonApp from './app';
import type Collection from './collection';
import Emitter from './emitter';
import { AttributeDefinition, Attributes, ModelOptions, ModelType } from './imports/model';
export default abstract class Model extends Emitter {
    protected app: ZeyonApp;
    abstract attrib: Attributes;
    options: ModelOptions<this['attrib']>;
    defaultOptions: ModelOptions<this['attrib']>;
    static type: ModelType;
    static definition: {
        [key: string]: AttributeDefinition;
    };
    protected attributes: this['attrib'];
    protected attributesOriginal: this['attrib'];
    protected hasUnsavedChanges: boolean;
    protected selected: boolean;
    private collection;
    constructor(options: ModelOptions<Attributes>, app: ZeyonApp);
    protected markUnsavedChanges(): this;
    protected areAttributesEqual(a: Partial<this['attrib']>, b: Partial<this['attrib']>): boolean;
    hasChanges(): boolean;
    set(attributes?: Partial<this['attrib']>, silent?: boolean): this;
    unset(attributeName: keyof this['attrib']): this;
    get<T extends keyof this['attrib']>(attributeName: keyof this['attrib']): T;
    getId(): number | undefined;
    getAttributes(): this['attrib'];
    setCollection(collection?: Collection): this;
    getCollection(): Collection | null;
    select(selected: boolean): this;
    isSelected(): boolean;
    reset(silent?: boolean): this;
    destroy(): void;
    validateAttributes(attributes: Partial<this['attrib']>): Partial<this['attrib']>;
    getType(): ModelType;
    static getAttributeKeys(): string[];
}
//# sourceMappingURL=model.d.ts.map