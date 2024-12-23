import type Collection from './collection';
import { ZeyonAppLike } from './imports/app';
import type { CollectionViewOptions } from './imports/collectionView';
import View from './view';
export default abstract class CollectionView<C extends Collection = Collection, CV extends View = View> extends View {
    options: CollectionViewOptions<C, CV>;
    defaultOptions: CollectionViewOptions<C, CV>;
    protected collection?: C;
    protected childView?: new (options: any, app: ZeyonAppLike) => CV;
    protected childItems: CV[];
    constructor(options: CollectionViewOptions<C, CV>, app: ZeyonAppLike);
    render(): Promise<this>;
    protected getTemplateOptions(): Record<string, unknown>;
    protected renderChildItems(): void;
    loadCollection(collection?: C): Promise<void>;
    protected destroyChildItems(ids?: string[]): void;
    protected listenToCollection(): void;
    protected setEmptyClass(): void;
    destroy(): void;
}
//# sourceMappingURL=collectionView.d.ts.map