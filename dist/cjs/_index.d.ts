import { AttributeDefinition } from './imports/model';
import Collection from './collection';
import CollectionView from './collectionView';
import Emitter from './emitter';
import Model from './model';
import RouteView from './routeView';
import View from './view';
export type { CollectionOptions } from './imports/collection';
export type { CollectionViewOptions } from './imports/collectionView';
export type { EmitterOptions } from './imports/emitter';
export type { ModelOptions } from './imports/model';
export type { RouteViewOptions } from './imports/routeView';
export type { ViewOptions } from './imports/view';
interface RegisterEmitterProps {
}
interface RegisterModelProps extends RegisterEmitterProps {
    attributes: Record<string, AttributeDefinition>;
}
interface RegisterCollectionProps extends RegisterEmitterProps {
    modelId: string;
}
interface RegisterViewProps extends RegisterEmitterProps {
    isComponent?: boolean;
    template?: string;
    templateWrapper?: string;
}
interface RegisterRouteViewProps extends RegisterViewProps {
}
interface RegisterCollectionViewProps extends RegisterRouteViewProps {
    childViewId: string;
    collectionId: string;
}
declare const _default: {
    registerEmitter(registrationId: string, props?: RegisterEmitterProps): void;
    registerModel(registrationId: string, props?: RegisterModelProps): <T extends {
        new (...args: any[]): {};
    }>(constructor: T) => T;
    registerCollection(registrationId: string, props?: RegisterCollectionProps): <T extends {
        new (...args: any[]): {};
    }>(constructor: T) => T;
    registerView(registrationId: string, props?: RegisterViewProps): <T extends {
        new (...args: any[]): {};
    }>(constructor: T) => T;
    registerRouteView(registrationId: string, props?: RegisterRouteViewProps): <T extends {
        new (...args: any[]): {};
    }>(constructor: T) => T;
    registerCollectionView(registrationId: string, props?: RegisterCollectionViewProps): <T extends {
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