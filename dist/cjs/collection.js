"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const emitter_1 = __importDefault(require("./emitter"));
const collection_1 = require("./imports/collection");
class Collection extends emitter_1.default {
    constructor(options = {}, app) {
        super({ events: [...(options.events || []), ...collection_1.collectionEvents] }, app);
        this.options = options;
        this.app = app;
        this.items = [];
        this.length = 0;
        this.visibleItems = [];
        this.visibleLength = 0;
        this.filterOptions = {};
        this.activeFilters = {};
        const { ids } = options;
        const funcs = [];
        if (ids && ids.length > 0) {
            const attrs = ids.map((id) => {
                return { id };
            });
            funcs.push(this.newModel(attrs));
        }
        funcs.push(this.initialize());
        Promise.all(funcs).then(() => this.markAsReady());
    }
    async newModel(attributes, silent = false) {
        const attributesArray = Array.isArray(attributes) ? attributes : [attributes];
        for (const attrs of attributesArray) {
            const model = await this.app.newInstance(`model-${this.getType()}`, {
                attributes: attrs,
                collection: this,
            });
            if (model) {
                this.add(model, silent);
            }
        }
        return this;
    }
    add(models, silent = false) {
        const modelsArray = Array.isArray(models) ? models : [models];
        modelsArray.forEach((model) => {
            if (this.getModelClass().type !== this.getType()) {
                console.error(`Only instances of ${this.getType()} can be added to the collection.`);
                return;
            }
            const id = model.getId();
            let existingModel;
            if (id) {
                existingModel = model.getId() ? this.findById(id) : undefined;
            }
            if (existingModel) {
                console.warn(`Model with ID ${model.getId()} already exists in the collection.`);
            }
            else {
                this.items.push(model);
                model.setCollection(this).on('*', (event, eventName) => {
                    let data = undefined;
                    if (event instanceof CustomEvent) {
                        data = event.detail;
                    }
                    this.emit(eventName, { model, data });
                }, this);
            }
            if (!silent) {
                this.emit('add', model);
            }
        });
        this.length = this.items.length;
        this.applyFilters();
        return this;
    }
    remove(itemIds, silent = false) {
        if (itemIds === undefined)
            return undefined;
        const ids = Array.isArray(itemIds) ? itemIds : [itemIds];
        const removedItems = [];
        ids.forEach((id) => {
            const index = this.items.findIndex((item) => item.getId() === id);
            if (index > -1) {
                const [removedItem] = this.items.splice(index, 1);
                removedItems.push(removedItem);
                removedItem.off({ subscriber: this });
            }
        });
        if (!silent) {
            this.emit('remove', removedItems);
        }
        this.length = this.items.length;
        this.applyFilters();
        return removedItems;
    }
    getType() {
        return this.getModelClass().type || "unknown";
    }
    getItems() {
        return this.items;
    }
    getAttributes() {
        return this.items.map((item) => item.getAttributes());
    }
    getAttributeKeys() {
        return this.getModelClass().getAttributeKeys();
    }
    getVisibleItems() {
        return this.visibleItems;
    }
    getVisibleAttributes() {
        return this.visibleItems.map((item) => item.getAttributes());
    }
    getSelectedItems(includeHidden = false) {
        if (includeHidden) {
            return this.items.filter((item) => item.isSelected());
        }
        return this.visibleItems.filter((item) => item.isSelected());
    }
    getIds() {
        return this.items.map((item) => item.getId()).filter((id) => id !== undefined);
    }
    getSelectedIds() {
        return this.getSelectedItems()
            .map((item) => item.getId())
            .filter((id) => id !== undefined);
    }
    findById(itemId) {
        return this.items.find((item) => item.getId() === itemId);
    }
    sort(compareFn) {
        this.items.sort(compareFn);
        this.applyFilters();
        this.emit('sort', this.visibleItems);
        return this;
    }
    empty() {
        this.items.forEach((item) => item.destroy());
        this.items = [];
        this.applyFilters();
        this.emit('update');
        return this;
    }
    destroy() {
        if (this.isDestroyed)
            return;
        this.isDestroyed = true;
        this.onDestroy();
        this.off();
        this.items.forEach((item) => item.destroy());
        this.items = [];
        this.length = 0;
        this.emit('destroyed');
    }
    filter(filterOptions, extend = true) {
        if (!extend) {
            this.activeFilters = {};
            this.filterOptions = {};
        }
        if (filterOptions) {
            Object.entries(filterOptions).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    const filterFn = this.getFilterFunction(key, value);
                    if (filterFn) {
                        this.activeFilters[key] = filterFn;
                        this.filterOptions[key] = value;
                    }
                }
                else {
                    delete this.activeFilters[key];
                    delete this.filterOptions[key];
                }
            });
        }
        this.applyFilters();
        this.emit('filter', this.visibleItems);
        return this;
    }
    getFilterFunction(key, value) {
        if (key === 'text') {
            const attributesToSearch = this.getTextSearchAttributes();
            return (item) => {
                const attributes = item.getAttributes();
                return attributesToSearch.some((attrKey) => {
                    const attrValue = attributes[attrKey];
                    return attrValue && String(attrValue).toLowerCase().includes(String(value).toLowerCase());
                });
            };
        }
        return undefined;
    }
    getFilterOptions() {
        return [
            {
                key: 'text',
                name: 'Quick search',
                textInput: true,
            },
        ];
    }
    applyFilters() {
        this.visibleItems = this.items.filter((item) => {
            return Object.values(this.activeFilters).every((filterFn) => filterFn(item));
        });
        this.visibleLength = this.visibleItems.length;
        return this;
    }
    clearFilters() {
        this.activeFilters = {};
        this.filterOptions = {};
        this.applyFilters();
        this.emit('filter', this.visibleItems);
        return this;
    }
    getTextSearchAttributes() {
        if (this.items.length > 0) {
            return Object.keys(this.items[0].getAttributes());
        }
        return [];
    }
}
exports.default = Collection;
//# sourceMappingURL=collection.js.map