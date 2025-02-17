import { collectionViewEvents } from './_events';
import { debounce } from './util/debounce';
import View from './view';
export default class CollectionView extends View {
    constructor(options, app) {
        super(options, app);
        this.modelViews = [];
        this.renderContent = debounce(this.renderContent.bind(this), {
            wait: 10,
            shouldAggregate: false,
        });
        this.extendValidEvents(collectionViewEvents);
        if (this.options.collection) {
            this.loadCollection(this.options.collection);
        }
        else if (this.options.collectionRegistrationId) {
            this.collectionRegistrationId = this.options.collectionRegistrationId;
            this.loadCollection();
        }
        else {
            throw new Error('Must provide either a collection or a collectionRegistrationId');
        }
    }
    getTemplateOptions() {
        return super.getTemplateOptions({
            ...(this.collection ? { collection: this.collection.getVisibleAttributes() } : {}),
            ...(this.collection ? { collectionType: this.collection.modelRegistrationId } : {}),
        });
    }
    async loadCollection(collection) {
        if (this.isDestroyed)
            return;
        if (this.collection) {
            this.collection.off({ subscriber: this });
        }
        if (!collection && this.collectionRegistrationId) {
            collection = await this.app.newCollection(this.collectionRegistrationId, this.options.collectionOptions || {});
        }
        else if (!this.collectionRegistrationId && collection) {
            this.collectionRegistrationId = collection.modelRegistrationId;
        }
        this.collection = collection;
        await this.collection.isReady;
        const eventHander = (type) => {
            if (this.hasBeenRendered)
                this.renderContent();
            this.emit(`collection:${type}`, this.collection);
        };
        this.collection.on('update', () => eventHander('update'), this);
        this.collection.on('filter', () => eventHander('filter'), this);
        this.collection.on('sort', () => eventHander('sort'), this);
        await this.isRendered;
        await this.renderContent();
    }
    async renderContent() {
        if (this.isDestroyed)
            return;
        this.destroyModelViews();
        if (this.collection) {
            await this.collection.isReady;
            const modelViews = await Promise.all(this.collection.getVisibleItems().map(async (model) => {
                return this.app.newView(this.modelViewRegistrationId, {
                    model,
                    attachTo: this.el,
                    ...(this.options.modelViewOptions || {}),
                });
            }));
            modelViews.forEach((modelView) => {
                modelView.render();
                this.children[modelView.getViewId()] = modelView;
                this.modelViews.push(modelView);
            });
        }
        this.toggleClass('is-empty', !this.collection || this.collection.visibleLength < 1);
    }
    destroyModelViews(ids) {
        if (ids && ids.length > 0) {
            ids.forEach((id) => this.destroyChildById(id));
            this.modelViews = this.modelViews.filter((v) => !ids.includes(v.getViewId()));
        }
        else {
            this.modelViews.forEach((v) => this.destroyChildById(v.getViewId()));
            this.modelViews = [];
        }
    }
    destroy(silent = false) {
        if (this.isDestroyed)
            return;
        super.destroy(silent);
        this.destroyModelViews();
        if (this.collection) {
            this.collection.off({ subscriber: this });
        }
        delete this.collection;
    }
}
//# sourceMappingURL=collectionView.js.map