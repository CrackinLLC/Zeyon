import type ZeyonApp from '../app';
import type { CollectionLike } from '../imports/collection';
import type View from '../view';
import type { ViewOptions } from './view';
export interface CollectionViewOptions<C extends CollectionLike, CV extends View> extends ViewOptions {
    collection?: C;
    childView?: new (options: any, app: ZeyonApp) => CV;
    childViewOptions?: any;
}
//# sourceMappingURL=collectionView.d.ts.map