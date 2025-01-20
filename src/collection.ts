import Emitter from './emitter';
import type { ClassMapTypeModel } from './generated/ClassMapType';
import { ZeyonAppLike } from './imports/app';
import {
  collectionEvents,
  CollectionFilterDefinition,
  CollectionFilterOptions,
  CollectionOptions,
} from './imports/collection';

export default abstract class Collection extends Emitter {
  declare options: CollectionOptions;
  declare defaultOptions: CollectionOptions;

  abstract modelRegistrationId: keyof ClassMapTypeModel;
  declare modelConstructor: ClassMapTypeModel[this['modelRegistrationId']]['definition'];
  declare model: InstanceType<this['modelConstructor']>;
  declare attrib: this['model']['attrib'];

  protected items: this['model'][] = [];
  public length: number = 0;
  protected visibleItems: this['model'][] = [];
  public visibleLength: number = 0;

  protected filterOptions: CollectionFilterOptions = {};
  protected activeFilters: Record<string, (item: this['model']) => boolean>;

  constructor(options: CollectionOptions = {}, protected app: ZeyonAppLike) {
    super(
      {
        ...options,
        events: [...(options.events || []), ...collectionEvents],
      },
      app,
    );

    const { ids } = this.options;
    const funcs = [];

    this.activeFilters = {};
    if (ids && ids.length > 0) {
      const attrs = ids.map((id) => {
        return { id } as this['attrib'];
      });

      funcs.push(this.newModel(attrs));
    }

    funcs.push(this.initialize());
    Promise.all(funcs).then(() => this.markAsReady());
  }

  public async newModel(
    attributes: Partial<this['attrib']> | Partial<this['attrib']>[],
    silent: boolean = false,
  ): Promise<this> {
    const attributesArray = Array.isArray(attributes) ? attributes : [attributes];

    for (const attrs of attributesArray) {
      const model = await this.app.newModel(this.getModelType(), {
        attributes: attrs,
        collection: this,
      });

      if (model) {
        this.add(model, silent);
      }
    }

    return this;
  }

  public add(models: this['model'] | this['model'][], silent: boolean = false): this {
    const modelsArray = Array.isArray(models) ? models : [models];

    modelsArray.forEach((model) => {
      if (this.modelRegistrationId !== model.getRegistrationId()) {
        console.error(`Only instances of ${this.modelRegistrationId} can be added to the collection.`);
        return;
      }

      const id = model.getId();
      let existingModel: this['model'] | undefined;
      if (id) {
        existingModel = model.getId() ? this.findById(id) : undefined;
      }

      if (existingModel) {
        console.warn(`Model with ID ${model.getId()} already exists in the collection.`);
      } else {
        this.items.push(model);

        model.setCollection(this).on(
          '*',
          (eventName, val, event) => {
            this.emit(eventName!, { model, data: val });
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

  public remove(
    itemIds: number | number[] | undefined,
    silent: boolean = false,
  ): this['model'] | this['model'][] | undefined {
    if (itemIds === undefined) return undefined;
    const ids = Array.isArray(itemIds) ? itemIds : [itemIds];
    const removedItems: this['model'][] = [];

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

  public getModelType(): keyof ClassMapTypeModel {
    return this.modelRegistrationId;
  }

  public getItems(): this['model'][] {
    return this.items;
  }

  public getAttributes(): object[] {
    return this.items.map((item) => item.getAttributes());
  }

  public getAttributeKeys(): string[] {
    return []; // TODO: Fix this
  }

  public getVisibleItems(): this['model'][] {
    return this.visibleItems;
  }

  public getVisibleAttributes(): object[] {
    return this.visibleItems.map((item) => item.getAttributes());
  }

  public getSelectedItems(includeHidden = false): this['model'][] {
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

  public findById(itemId: number): this['model'] | undefined {
    return this.items.find((item) => item.getId() === itemId);
  }

  public sort(compareFn: (a: this['model'], b: this['model']) => number): this {
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

  public getFilterFunction(key: string, value: any): ((item: this['model']) => boolean) | undefined {
    if (key === 'text') {
      const attributesToSearch = this.getTextSearchAttributes();

      return (item: this['model']) => {
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
