import type ApplicationCore from './app';
import Emitter from './emitter';
import {
  collectionEvents,
  CollectionFilterDefinition,
  CollectionFilterOptions,
  CollectionLike,
  CollectionOptions,
} from './imports/collection';
import { ModelType } from './imports/model';
import Model from './model';

export default class Collection<M extends Model<any, any>> extends Emitter implements CollectionLike<M> {
  declare model: M;
  protected type: M['type'] = ModelType.Unknown;

  protected items: M[] = [];
  public length: number = 0;
  protected visibleItems: M[] = [];
  public visibleLength: number = 0;

  protected activeFilters: { [key: string]: (item: M) => boolean } = {};
  public filterOptions: CollectionFilterOptions = {};
  public isDestroyed: boolean = false;
  public isReady: Promise<this>;

  constructor(public options: CollectionOptions = {}, protected app: ApplicationCore) {
    super({ customEvents: [...(options.customEvents || []), ...collectionEvents] });

    this.isReady = Promise.resolve(this);
  }

  public async newModel(attributes: Partial<M> | Partial<M>[], silent: boolean = false): Promise<this> {
    const attributesArray = Array.isArray(attributes) ? attributes : [attributes];

    for (const attrs of attributesArray) {
      const model = await this.app.newInstance<M>(`model-${this.getType()}`, {
        attributes: attrs,
      });

      if (model) {
        this.add(model, silent);
      }
    }

    return this;
  }

  public add(models: M | M[], silent: boolean = false): this {
    const modelsArray = Array.isArray(models) ? models : [models];

    modelsArray.forEach((model) => {
      if (!(model instanceof Model)) {
        console.error(`Only instances of ${this.type} can be added to the collection.`);
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
        model.setCollection(this);

        model.on('all', {
          handler: (event, eventName) => {
            let data: unknown = undefined;

            if (event instanceof CustomEvent) {
              data = event.detail;
            }

            this.emit(eventName!, { model, data });
          },
          listener: this,
        });
      }

      if (!silent) {
        this.emit('add', model);
      }
    });

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
        removedItem.off({ listener: this });
      }
    });

    if (!silent) {
      this.emit('remove', removedItems);
    }

    this.applyFilters();
    return removedItems.length === 1 ? removedItems[0] : removedItems.length > 0 ? removedItems : undefined;
  }

  public getType(): ModelType {
    return this.type;
  }

  public getItems(): M[] {
    return this.items;
  }

  public getAttributes(): object[] {
    return this.items.map((item) => item.getAttributes());
  }

  // TODO: Implement a way of getting attribute keys from our model type
  // public getAttributeKeys(): string[] {
  //   if (this.attributeDefinition) {
  //     return Object.keys(this.attributeDefinition);
  //   }
  //   return [];
  // }

  public getVisibleItems(): M[] {
    return this.visibleItems;
  }

  public getVisibleAttributes(): object[] {
    return this.visibleItems.map((item) => item.getAttributes());
  }

  public getSelectedItems(): M[] {
    return this.items.filter((item) => item.isSelected());
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

  public sort(compareFn: (a: M, b: M) => number): void {
    this.items.sort(compareFn);
    this.applyFilters();
    this.emit('sort', this.visibleItems);
  }

  public empty(): void {
    this.items.forEach((item) => item.destroy());
    this.items = [];
    this.applyFilters();
    this.emit('update');
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    this.onDestroy();

    this.off({ force: true });
    this.items.forEach((item) => item.destroy());
    this.items = [];

    this.emit('destroyed');
  }

  protected onDestroy(): void {}

  public filter(filterOptions?: CollectionFilterOptions, extend: boolean = true): void {
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

    // Additional filter functions can be implemented here

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

  protected applyFilters(): void {
    this.visibleItems = this.items.filter((item) => {
      return Object.values(this.activeFilters).every((filterFn) => filterFn(item));
    });
    this.visibleLength = this.visibleItems.length;
  }

  protected getTextSearchAttributes(): string[] {
    if (this.items.length > 0) {
      return Object.keys(this.items[0].getAttributes());
    }
    return [];
  }
}
