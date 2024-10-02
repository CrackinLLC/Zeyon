import type { CollectionLike } from "../_imports/collection";
import type { ViewOptions } from "./view";

export interface CollectionViewOptions<
  C extends CollectionLike = CollectionLike,
  CVO extends ViewOptions = ViewOptions
> extends ViewOptions {
  collection?: C;
  childViewOptions?: Partial<CVO>;
}
