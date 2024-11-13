import type HarnessApp from './app';
import type Collection from './collection';
import Emitter from './emitter';
import { AttributeDefinition, Attributes, ModelOptions, ModelType } from './imports/model';
export default abstract class Model<A extends Attributes> extends Emitter {
    readonly options: ModelOptions<A>;
    protected app: HarnessApp;
    static type: ModelType;
    static definition: {
        [key: string]: AttributeDefinition;
    };
    protected attributes: A;
    protected attributesOriginal: A;
    protected hasUnsavedChanges: boolean;
    protected selected: boolean;
    private collection;
    constructor(options: ModelOptions<A>, app: HarnessApp);
    protected markUnsavedChanges(): Model<A>;
    protected areAttributesEqual(a: Partial<A>, b: Partial<A>): boolean;
    hasChanges(): boolean;
    set(attributes?: Partial<A>, silent?: boolean): Model<A>;
    unset(attributeName: keyof A): Model<A>;
    get<T extends A[keyof A]>(attributeName: keyof A): T;
    getId(): number | undefined;
    getAttributes(): A;
    setCollection(collection?: Collection<A, any>): Model<A>;
    getCollection(): Collection<A, any> | null;
    select(selected: boolean): Model<A>;
    isSelected(): boolean;
    reset(silent?: boolean): Model<A>;
    destroy(): void;
    validateAttributes(attributes: Partial<A>): Partial<A>;
    getType(): ModelType;
    static getAttributeKeys(): string[];
}
//# sourceMappingURL=model.d.ts.map