import { ClassMapTypeCollection, ClassMapTypeView } from './_maps';
import Collection from './collection';
import type { ZeyonAppLike } from './imports/app';
import { CollectionViewOptions } from './imports/collectionView';
import View from './view';
export default abstract class CollectionView extends View {
    options: CollectionViewOptions;
    defaultOptions: CollectionViewOptions;
    abstract modelViewRegistrationId: keyof ClassMapTypeView;
    protected modelViews: View[];
    protected collection?: Collection;
    protected collectionRegistrationId?: keyof ClassMapTypeCollection;
    constructor(options: CollectionViewOptions, app: ZeyonAppLike);
    protected getTemplateOptions(): Record<string, unknown>;
    loadCollection(collection?: Collection): Promise<void>;
    protected renderContent(): Promise<void>;
    protected destroyModelViews(ids?: string[]): void;
    destroy(silent?: boolean): void;
}
//# sourceMappingURL=collectionView.d.ts.map