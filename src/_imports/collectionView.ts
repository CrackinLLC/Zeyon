import type { CollectionLike } from '../../../model/collection/_imports/_baseCollection';
import type { BaseViewOptions } from '../../_imports/_baseView';

export interface BaseCollectionViewOptions<
  C extends CollectionLike = CollectionLike,
  CVO extends BaseViewOptions = BaseViewOptions,
> extends BaseViewOptions {
  collection?: C;
  childViewOptions?: Partial<CVO>;
}
