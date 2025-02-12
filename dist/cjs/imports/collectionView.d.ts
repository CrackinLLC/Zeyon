import type { ClassMapTypeCollection } from 'zeyon/_maps';
import type Collection from '../collection';
import type { ViewOptions } from './view';
export interface CollectionViewOptions extends ViewOptions {
    collection?: Collection;
    collectionRegistrationId?: string & keyof ClassMapTypeCollection;
    collectionOptions?: unknown;
    modelViewOptions?: unknown;
}
export declare const collectionViewEvents: string[];
//# sourceMappingURL=collectionView.d.ts.map