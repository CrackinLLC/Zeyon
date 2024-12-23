"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debounce_1 = require("./util/debounce");
const view_1 = __importDefault(require("./view"));
class CollectionView extends view_1.default {
    constructor(options, app) {
        super(options, app);
        this.childItems = [];
        this.extendValidEvents(['change']);
        this.renderChildItems = (0, debounce_1.debounce)(this.renderChildItems.bind(this));
        this.collection = this.options.collection;
        this.childView = this.options.childView;
    }
    async render() {
        await super.render();
        try {
            if (this.collection) {
                await this.loadCollection(this.collection);
            }
            else {
                this.renderChildItems();
            }
        }
        catch (error) {
            console.error('Error rendering collection view:', error);
        }
        this.setEmptyClass();
        return this;
    }
    getTemplateOptions() {
        return super.getTemplateOptions({
            ...(this.collection ? { collection: this.collection.getVisibleAttributes() } : {}),
            ...(this.collection ? { collectionType: this.collection.modelRegistrationId } : {}),
        });
    }
    renderChildItems() {
        if (this.isDestroyed || !this.collection)
            return;
        this.destroyChildItems();
        this.collection.getVisibleItems().forEach((model) => {
            if (this.childView) {
                const childView = new this.childView({
                    model,
                    attachTo: this.el,
                    ...this.options.childViewOptions,
                }, this.app);
                childView.render();
                this.children[childView.getViewId()] = childView;
                this.childItems.push(childView);
            }
        });
        this.setEmptyClass();
    }
    async loadCollection(collection) {
        if (this.collection) {
            this.collection.off({ subscriber: this });
        }
        this.collection = collection;
        if (this.collection) {
            await this.collection.isReady;
            this.listenToCollection();
            await this.isRendered;
            this.renderChildItems();
        }
    }
    destroyChildItems(ids) {
        if (ids && ids.length) {
            ids.forEach((id) => {
                this.destroyChildById(id);
            });
        }
        else {
            this.childItems.forEach((child) => {
                this.destroyChildById(child.getViewId());
            });
            this.childItems = [];
        }
    }
    listenToCollection() {
        if (!this.collection)
            return;
        this.collection.on('update', () => {
            this.renderChildItems();
            this.emit('change', this.collection), this;
        });
        this.collection.on('filter', () => {
            this.renderChildItems();
            this.emit('change', this.collection), this;
        });
        this.collection.on('sort', () => {
            this.renderChildItems();
            this.emit('change', this.collection), this;
        });
    }
    setEmptyClass() {
        this.toggleClass('is-empty', !this.collection || this.collection.visibleLength === 0);
    }
    destroy() {
        this.destroyChildItems();
        if (this.collection) {
            this.collection.off({ subscriber: this });
        }
        delete this.collection;
        return super.destroy();
    }
}
exports.default = CollectionView;
//# sourceMappingURL=collectionView.js.map