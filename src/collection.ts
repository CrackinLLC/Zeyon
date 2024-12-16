import type ZeyonApp from './app';
import Emitter from './emitter';
import {
  collectionEvents,
  CollectionFilterDefinition,
  CollectionFilterOptions,
  CollectionLike,
  CollectionOptions,
} from './imports/collection';
import { Attributes, ModelType } from './imports/model';
import Model from './model';

export default abstract class Collection<A extends Attributes, M extends Model<any>>
  extends Emitter
  implements CollectionLike<A, M>
{
  declare options: CollectionOptions;
  declare defaultOptions: CollectionOptions;

  protected abstract getModelClass(): typeof Model<A>;

  protected items: M[] = [];
  public length: number = 0;
  protected visibleItems: M[] = [];
  public visibleLength: number = 0;

  protected filterOptions: CollectionFilterOptions = {};
  protected activeFilters: { [key: string]: (item: M) => boolean } = {};

  constructor(options: CollectionOptions = {}, protected app: ZeyonApp) {
    super({ ...options, events: [...(options.events || []), ...collectionEvents] }, app);

    const { ids } = this.options;
    const funcs = [];

    if (ids && ids.length > 0) {
      const attrs = ids.map((id) => {
        return { id } as A;
      });

      funcs.push(this.newModel(attrs));
    }

    funcs.push(this.initialize());
    Promise.all(funcs).then(() => this.markAsReady());
  }

  public async newModel(attributes: Partial<A> | Partial<A>[], silent: boolean = false): Promise<this> {
    const attributesArray = Array.isArray(attributes) ? attributes : [attributes];

    for (const attrs of attributesArray) {
      const model = await this.app.newModel(`model-${this.getType()}`, {
        attributes: attrs,
        collection: this as unknown as Collection<Attributes, any>, // TODO: Can we figure out how to avoid casting here to satisfy TS?
      });

      if (model) {
        this.add(model as unknown as M, silent);
      }
    }

    return this;
  }

  public add(models: M | M[], silent: boolean = false): this {
    const modelsArray = Array.isArray(models) ? models : [models];

    modelsArray.forEach((model) => {
      if (this.getModelClass().type !== this.getType()) {
        console.error(`Only instances of ${this.getType()} can be added to the collection.`);
        return;
      }

      const id = model.getId();
      let existingModel: M | undefined;
      if (id) {
        existingModel = model.getId() ? this.findById(id) : undefined;
      }

      if (existingModel) {
        console.warn(`Model with ID ${model.getId()} already exists in the collection.`);
      } else {
        this.items.push(model);

        model.setCollection(this).on(
          '*',
          (event, eventName) => {
            let data: unknown = undefined;

            if (event instanceof CustomEvent) {
              data = event.detail;
            }

            this.emit(eventName!, { model, data });
          },
          this,
        );
      }

      if (!silent) {
        this.emit('add', model);
      }
    });

    this.length = this.items.length;
    this.applyFilters();
    return this;
  }

  public remove(itemIds: number | number[] | undefined, silent: boolean = false): M | M[] | undefined {
    if (itemIds === undefined) return undefined;
    const ids = Array.isArray(itemIds) ? itemIds : [itemIds];
    const removedItems: M[] = [];

    ids.forEach((id: number) => {
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

  public getType(): ModelType {
    return this.getModelClass().type || ModelType.Unknown;
  }

  public getItems(): M[] {
    return this.items;
  }

  public getAttributes(): object[] {
    return this.items.map((item) => item.getAttributes());
  }

  public getAttributeKeys(): string[] {
    return this.getModelClass().getAttributeKeys();
  }

  public getVisibleItems(): M[] {
    return this.visibleItems;
  }

  public getVisibleAttributes(): object[] {
    return this.visibleItems.map((item) => item.getAttributes());
  }

  public getSelectedItems(includeHidden = false): M[] {
    if (includeHidden) {
      return this.items.filter((item) => item.isSelected());
    }
    return this.visibleItems.filter((item) => item.isSelected());
  }

  public getIds(): number[] {
    return this.items.map((item) => item.getId()).filter((id): id is number => id !== undefined);
  }

  public getSelectedIds(): number[] {
    return this.getSelectedItems()
      .map((item) => item.getId())
      .filter((id): id is number => id !== undefined);
  }

  public findById(itemId: number): M | undefined {
    return this.items.find((item) => item.getId() === itemId);
  }

  public sort(compareFn: (a: M, b: M) => number): this {
    this.items.sort(compareFn);
    this.applyFilters();
    this.emit('sort', this.visibleItems);

    return this;
  }

  public empty(): this {
    this.items.forEach((item) => item.destroy());
    this.items = [];
    this.applyFilters();
    this.emit('update');

    return this;
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    this.onDestroy();

    this.off();
    this.items.forEach((item) => item.destroy());
    this.items = [];
    this.length = 0;

    this.emit('destroyed');
  }

  public filter(filterOptions?: CollectionFilterOptions, extend: boolean = true): this {
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
        } else {
          delete this.activeFilters[key];
          delete this.filterOptions[key];
        }
      });
    }

    this.applyFilters();
    this.emit('filter', this.visibleItems);

    return this;
  }

  public getFilterFunction(key: string, value: any): ((item: M) => boolean) | undefined {
    if (key === 'text') {
      const attributesToSearch = this.getTextSearchAttributes();

      return (item: M) => {
        const attributes = item.getAttributes();
        return attributesToSearch.some((attrKey) => {
          const attrValue = attributes[attrKey];
          return attrValue && String(attrValue).toLowerCase().includes(String(value).toLowerCase());
        });
      };
    }

    return undefined;
  }

  public getFilterOptions(): CollectionFilterDefinition[] {
    return [
      {
        key: 'text',
        name: 'Quick search',
        textInput: true,
      },
    ];
  }

  protected applyFilters(): this {
    this.visibleItems = this.items.filter((item) => {
      return Object.values(this.activeFilters).every((filterFn) => filterFn(item));
    });
    this.visibleLength = this.visibleItems.length;

    return this;
  }

  public clearFilters(): this {
    this.activeFilters = {};
    this.filterOptions = {};
    this.applyFilters();
    this.emit('filter', this.visibleItems);

    return this;
  }

  protected getTextSearchAttributes(): string[] {
    if (this.items.length > 0) {
      return Object.keys(this.items[0].getAttributes()) as string[];
    }
    return [];
  }
}
