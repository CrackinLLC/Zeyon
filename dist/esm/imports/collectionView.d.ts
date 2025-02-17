import { ClassMapTypeCollection } from 'zeyon/imports';
import type Collection from '../collection';
import type { ViewOptions } from './view';
export interface CollectionViewOptions extends ViewOptions {
    collection?: Collection;
    collectionRegistrationId?: string & keyof ClassMapTypeCollection;
    collectionOptions?: unknown;
    modelViewOptions?: unknown;
}
//# sourceMappingURL=collectionView.d.ts.map