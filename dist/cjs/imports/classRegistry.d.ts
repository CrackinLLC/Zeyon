import { Attributes, CollectionOptions, CollectionViewOptions, EmitterOptions, ModelOptions, RouterOptions, ViewOptions, ZeyonAppLike } from '../_imports';
import type Collection from '../collection';
import type CollectionView from '../collectionView';
import type Emitter from '../emitter';
import type Model from '../model';
import type RouteView from '../routeView';
import type View from '../view';
export type ClassOptions = EmitterOptions | RouterOptions | CollectionOptions | CollectionViewOptions | ModelOptions<Attributes> | ViewOptions;
export type AnyDefinition = EmitterDefinition<any> | ViewDefinition<any> | RouteViewDefinition<any> | ModelDefinition<any> | CollectionDefinition<any> | CollectionViewDefinition<any>;
export interface ClassRegistryOptions extends EmitterOptions {
    registryClassList?: {
        [id: string]: AnyDefinition & {
            options: ClassOptions;
        };
    };
}
export interface ClassMetadata {
    regiatrationId: string;
    options: ClassOptions;
    version?: string;
}
export interface EmitterDefinition<I extends Emitter> {
    new (options: I['options'], app: ZeyonAppLike): I;
    registrationId: string;
}
export interface ViewDefinition<I extends View> {
    new (options: I['options'], app: ZeyonAppLike): I;
    registrationId: string;
}
export interface RouteViewDefinition<I extends RouteView> {
    new (options: I['options'], app: ZeyonAppLike): I;
    registrationId: string;
}
export interface ModelDefinition<I extends Model> {
    new (options: I['options'], app: ZeyonAppLike): I;
    registrationId: string;
}
export interface CollectionDefinition<I extends Collection> {
    new (options: I['options'], app: ZeyonAppLike): I;
    registrationId: string;
}
export interface CollectionViewDefinition<I extends CollectionView> {
    new (options: I['options'], app: ZeyonAppLike): I;
    registrationId: string;
}
export interface ClassMapEntry {
    classRef: AnyDefinition;
    type: string;
}
export interface ClassMapData {
    [registrationId: string]: ClassMapEntry;
}
export type ClassCategory = 'Model' | 'Collection' | 'View' | 'RouteView' | 'CollectionView';
//# sourceMappingURL=classRegistry.d.ts.map