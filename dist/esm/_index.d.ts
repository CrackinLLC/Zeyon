import type { ClassMapTypeCollection, ClassMapTypeModel, ClassMapTypeView } from './_maps';
import { AttributeDefinition } from './imports/model';
import Collection from './collection';
import CollectionView from './collectionView';
import Emitter from './emitter';
import Model from './model';
import RouteView from './routeView';
import View from './view';
import type { CollectionOptions } from './imports/collection';
import type { CollectionViewOptions } from './imports/collectionView';
import type { EmitterOptions } from './imports/emitter';
import type { Attributes, ModelOptions } from './imports/model';
import type { RouteViewOptions } from './imports/routeView';
import type { ViewOptions } from './imports/view';
export { CollectionOptions, CollectionViewOptions, EmitterOptions, ModelOptions, RouteViewOptions, ViewOptions };
interface RegisterEmitterProps {
}
interface RegisterModelProps extends RegisterEmitterProps {
    attributes: Record<string, AttributeDefinition>;
}
interface RegisterCollectionProps extends RegisterEmitterProps {
    modelRegistrationId: keyof ClassMapTypeModel;
}
interface RegisterViewProps extends RegisterEmitterProps {
    tagName?: string;
    isComponent?: boolean;
    template?: string;
    templateWrapper?: string;
}
interface RegisterRouteViewProps extends RegisterViewProps {
}
interface RegisterCollectionViewProps extends RegisterRouteViewProps {
    modelViewRegistrationId: keyof ClassMapTypeView;
    collectionRegistrationId: keyof ClassMapTypeCollection;
}
declare const _default: {
    registerEmitter<O extends EmitterOptions = EmitterOptions>(registrationId: string, props?: RegisterEmitterProps): <T extends {
        new (...args: any[]): {};
    }>(constructor: T) => T;
    registerModel<O extends ModelOptions<Attributes> = ModelOptions<Attributes>>(registrationId: string, props?: RegisterModelProps): <T extends {
        new (...args: any[]): {};
    }>(constructor: T) => T;
    registerCollection<O extends CollectionOptions = CollectionOptions>(registrationId: string, props?: RegisterCollectionProps): <T extends {
        new (...args: any[]): {};
    }>(constructor: T) => T;
    registerView<O extends ViewOptions = ViewOptions>(registrationId: string, props?: RegisterViewProps): <T extends {
        new (...args: any[]): {};
    }>(constructor: T) => T;
    registerRouteView<O extends RouteViewOptions = RouteViewOptions>(registrationId: string, props?: RegisterRouteViewProps): <T extends {
        new (...args: any[]): {};
    }>(constructor: T) => T;
    registerCollectionView<O extends CollectionViewOptions = CollectionViewOptions>(registrationId: string, props?: RegisterCollectionViewProps): <T extends {
        new (...args: any[]): {};
    }>(constructor: T) => T;
    Emitter: typeof Emitter;
    Model: typeof Model;
    Collection: typeof Collection;
    View: typeof View;
    RouteView: typeof RouteView;
    CollectionView: typeof CollectionView;
};
export default _default;
//# sourceMappingURL=_index.d.ts.map