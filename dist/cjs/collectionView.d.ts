import type HarnessApp from './app';
import type { CollectionLike } from './imports/collection';
import type { CollectionViewOptions } from './imports/collectionView';
import View from './view';
export default class CollectionView<C extends CollectionLike = CollectionLike, CV extends View = View> extends View {
    options: CollectionViewOptions<C, CV>;
    protected collection?: C;
    protected childView?: new (options: any, app: HarnessApp) => CV;
    protected childItems: CV[];
    constructor(options: CollectionViewOptions<C, CV>, app: HarnessApp);
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