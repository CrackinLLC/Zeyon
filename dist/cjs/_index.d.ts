import type { ClassMapTypeCollection, ClassMapTypeModel, ClassMapTypeView } from 'zeyon/_maps';
import { AttributeDefinition } from './imports/model';
import Collection from './collection';
import CollectionView from './collectionView';
import Emitter from './emitter';
import Model from './model';
import RouteView from './routeView';
import View from './view';
import { CollectionOptions } from './imports/collection';
import { CollectionViewOptions } from './imports/collectionView';
import { EmitterOptions } from './imports/emitter';
import { Attributes, ModelOptions } from './imports/model';
import { RouteViewOptions } from './imports/routeView';
import { ViewOptions } from './imports/view';
import * as loader from './util/loader';
import * as object from './util/object';
import * as string from './util/string';
interface RegisterEmitterProps {
}
interface RegisterModelProps extends RegisterEmitterProps {
    attributes: Record<string, AttributeDefinition>;
}
interface RegisterCollectionProps extends RegisterEmitterProps {
    modelRegistrationId: string & keyof ClassMapTypeModel;
}
interface RegisterViewProps extends RegisterEmitterProps {
    tagName?: string;
    isComponent?: boolean;
    template?: string;
    templateWrapper?: string;
    ui?: {
        [key: string]: string;
    };
    styles?: string;
}
interface RegisterRouteViewProps extends RegisterViewProps {
}
interface RegisterCollectionViewProps extends RegisterRouteViewProps {
    modelViewRegistrationId: string & keyof ClassMapTypeView;
    collectionRegistrationId: string & keyof ClassMapTypeCollection;
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
    string: typeof string;
    loader: typeof loader;
    object: typeof object;
};
export default _default;
export type { CollectionOptions, CollectionViewOptions, EmitterOptions, ModelOptions, RouteViewOptions, ViewOptions };
export type { AnyEventHandler, ClassConfigurationOptions, EventHandlerApply, NativeEventHandler, NormalEventHandler, WildcardEventHandler, } from './imports/emitter';
//# sourceMappingURL=_index.d.ts.map