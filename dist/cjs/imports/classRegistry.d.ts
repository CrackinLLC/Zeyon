import type CollectionView from '../collectionView';
import type Emitter from '../emitter';
import type { CollectionLike, CollectionOptions } from '../imports/collection';
import type { CollectionViewOptions } from '../imports/collectionView';
import type { EmitterOptions } from '../imports/emitter';
import type { Attributes, ModelOptions } from '../imports/model';
import type { RouterOptions } from '../imports/router';
import type { ViewOptions } from '../imports/view';
import type Model from '../model';
import type RouteView from '../route';
import type Router from '../router';
import type View from '../view';
interface ClassRegistryOptions extends EmitterOptions {
    registryClassList?: {
        [id: string]: ClassDefinition;
    };
}
interface ClassMetadata {
    version?: string;
}
interface ClassEntry {
    classDef: ClassDefinition;
    metadata: ClassMetadata;
}
type ClassOptions = EmitterOptions | RouterOptions | CollectionOptions | CollectionViewOptions<CollectionLike, View> | ModelOptions | ViewOptions;
type ClassInstance = (Emitter | Router | CollectionLike | CollectionView<CollectionLike> | Model<Attributes> | View | RouteView) & {
    options: ClassOptions;
};
interface ClassDefinition {
    new (...args: any[]): ClassInstance;
}
interface ControllerDefinition {
    new (...args: any[]): Emitter;
}
export { ClassDefinition, ClassEntry, ClassInstance, ClassMetadata, ClassOptions, ClassRegistryOptions, ControllerDefinition, };
//# sourceMappingURL=classRegistry.d.ts.map