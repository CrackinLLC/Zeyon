import type Collection from '../collection';
import { ZeyonAppLike } from '../imports/app';
import type View from '../view';
import type { ViewOptions } from './view';

export interface CollectionViewOptions<C extends Collection, CV extends View> extends ViewOptions {
  collection?: C;
  childView?: new (options: any, app: ZeyonAppLike) => CV;
  childViewOptions?: any;
}
