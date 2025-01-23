import { ClassMapTypeCollection } from '../_types';
import type Collection from '../collection';
import type { ViewOptions } from './view';
export interface CollectionViewOptions extends ViewOptions {
    collection?: Collection;
    collectionRegistrationId?: keyof ClassMapTypeCollection;
    collectionOptions?: unknown;
    modelViewOptions?: unknown;
}
export declare const collectionViewEvents: string[];
//# sourceMappingURL=collectionView.d.ts.map