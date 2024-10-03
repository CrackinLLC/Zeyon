import type ApplicationCore from '../app';
import type { CollectionLike } from '../imports/collection';
import type Model from '../model';
import type View from '../view';
import type { ViewOptions } from './view';

export interface CollectionViewOptions<C extends CollectionLike<Model>, CV extends View> extends ViewOptions {
  collection?: C;
  childView?: new (options: any, app: ApplicationCore) => CV;
  childViewOptions?: any;
}
