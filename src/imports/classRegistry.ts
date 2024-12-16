import type ZeyonApp from '../app';
import type CollectionView from '../collectionView';
import type Emitter from '../emitter';
import type { CollectionLike, CollectionOptions } from '../imports/collection';
import type { CollectionViewOptions } from '../imports/collectionView';
import type { EmitterOptions } from '../imports/emitter';
import type { Attributes, ModelOptions } from '../imports/model';
import type { RouterOptions } from '../imports/router';
import type { ViewOptions } from '../imports/view';
import type Model from '../model';
import type RouteView from '../routeView';
import type Router from '../router';
import type View from '../view';

interface ClassRegistryOptions extends EmitterOptions {
  registryClassList?: { [id: string]: ClassDefinition };
}

interface ClassMetadata {
  regiatrationId: string;
  options: ClassOptions;
  version?: string;
}

type ClassOptions =
  | EmitterOptions
  | RouterOptions
  | CollectionOptions
  | CollectionViewOptions<CollectionLike, View>
  | ModelOptions
  | ViewOptions;

type ClassInstance = (
  | Emitter
  | Router
  | CollectionLike
  | CollectionView<CollectionLike>
  | Model<Attributes>
  | View
  | RouteView
) & {
  options: ClassOptions;
};

interface ClassDefinition<T extends ClassInstance = Emitter> {
  new (options: T['options'], app: ZeyonApp): T;
  registrationId: string;
}

export { ClassDefinition, ClassInstance, ClassMetadata, ClassOptions, ClassRegistryOptions };
