import { collectionEvents } from './_events';
import Emitter from './emitter';
import { debounce } from './util/debounce';
export default class Collection extends Emitter {
    constructor(options = {}, app) {
        super({
            ...options,
            events: [...(options.events || []), ...collectionEvents],
        }, app);
        this.app = app;
        this.items = [];
        this.length = 0;
        this.visibleItems = [];
        this.visibleLength = 0;
        this.filterOptions = {};
        const { ids } = this.options;
        const funcs = [];
        this.activeFilters = {};
        if (ids && ids.length > 0) {
            const attrs = ids.map((id) => {
                return { id };
            });
            funcs.push(this.newModel(attrs));
        }
        this.applyFilters = debounce(this.applyFilters.bind(this), { wait: 10, shouldAggregate: false });
        funcs.push(this.initialize());
        Promise.all(funcs).then(() => this.markAsReady());
    }
    async newModel(attributes, silent = false) {
        if (!Array.isArray(attributes)) {
            attributes = [attributes];
        }
        const createdModels = await Promise.all(attributes.map((attrs) => this.app
            .newModel(this.getModelType(), {
            attributes: attrs,
            collection: this,
        })
            .then((model) => {
            if (model) {
                this.add(model, true);
            }
            return model;
        })));
        this.sort(undefined, silent);
        if (!silent) {
            this.emit('update', { action: 'new', models: createdModels });
        }
        return this;
    }
    add(models, silent = false) {
        const modelsArray = Array.isArray(models) ? models : [models];
        const itemsAdded = [];
        modelsArray.forEach((model) => {
            if (this.modelRegistrationId !== model.getRegistrationId()) {
                console.error(`Only instances of ${this.modelRegistrationId} can be added to the collection. Attempted to add ${model.getRegistrationId()}.`);
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
                model
                    .setCollection(this)
                    .on('change', (data) => {
                    this.emit('model:change', { models: [model], data });
                })
                    .on('reset', (data) => {
                    this.emit('model:reset', { models: [model], data });
                })
                    .on('selected', (state) => {
                    this.emit('model:selected', { models: [model], state });
                })
                    .on('destroyed', () => {
                    this.remove(model.getId(), true);
                });
                this.items.push(model);
                itemsAdded.push(model);
            }
        });
        if (!silent) {
            this.emit('update', { action: 'add', models: itemsAdded });
        }
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
            this.emit('update', { action: 'remove', models: removedItems });
        }
        this.length = this.items.length;
        this.applyFilters();
        return removedItems;
    }
    getModelType() {
        return this.modelRegistrationId;
    }
    getItems() {
        return this.items;
    }
    getAttributes() {
        return this.items.map((item) => item.getAttributes());
    }
    getAttributeKeys() {
        const ctor = this.modelConstructor;
        if (ctor.definition) {
            return Object.keys(ctor.definition);
        }
        else if (this.items.length > 0) {
            return Object.keys(this.items[0].getAttributes());
        }
        console.warn('Something went wrong... unable to determine attribute keys.');
        return [];
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
    sort(compareFn, silent = false) {
        if (compareFn) {
            this.sortFunction = compareFn;
        }
        else if (!this.sortFunction) {
            const def = this.modelConstructor.definition;
            const defaultKey = Object.keys(def).find((k) => def[k].isDefaultSortKey) || 'id';
            this.sortFunction = (a, b) => {
                const valA = a.getAttributes()[defaultKey];
                const valB = b.getAttributes()[defaultKey];
                return (valA ?? '') > (valB ?? '') ? 1 : -1;
            };
        }
        this.items.sort(this.sortFunction);
        this.applyFilters();
        if (!silent) {
            this.emit('sort', this.visibleItems);
        }
        return this;
    }
    empty(silent = false) {
        this.items.forEach((item) => item.destroy(true));
        this.visibleItems = [];
        this.visibleLength = 0;
        this.items = [];
        this.length = 0;
        this.applyFilters();
        if (!silent) {
            this.emit('update', { action: 'empty' });
        }
        return this;
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
        if (!this.activeFilters || !this.activeFilters.length) {
            this.visibleItems = this.items;
        }
        else {
            this.visibleItems = this.items.filter((item) => {
                return Object.values(this.activeFilters).every((filterFn) => filterFn(item));
            });
        }
        this.visibleLength = this.visibleItems.length;
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
    destroy(silent = false) {
        if (this.isDestroyed)
            return;
        super.destroy(silent);
        this.off();
        this.empty(true);
    }
}
//# sourceMappingURL=collection.js.map