import {
  ClassMapTypeModel,
  CollectionFilterDefinition,
  CollectionFilterOptions,
  CollectionOptions,
  ZeyonAppLike,
} from 'zeyon/imports';
import { collectionEvents } from './_events';
import Emitter from './emitter';
import type Model from './model';
import { debounce } from './util/debounce';

export default abstract class Collection extends Emitter {
  declare options: CollectionOptions;
  declare defaultOptions: CollectionOptions;

  abstract modelRegistrationId: string & keyof ClassMapTypeModel;
  declare modelConstructor: ClassMapTypeModel[this['modelRegistrationId']]['classRef'];
  declare model: InstanceType<this['modelConstructor']>;
  declare attrib: this['model']['attrib'];

  protected items: this['model'][] = [];
  public length: number = 0;
  protected visibleItems: this['model'][] = [];
  public visibleLength: number = 0;

  protected filterOptions: CollectionFilterOptions = {};
  protected activeFilters: Record<string, (item: this['model']) => boolean>;
  protected sortFunction: ((a: this['model'], b: this['model']) => number) | undefined;

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

    this.applyFilters = debounce(this.applyFilters.bind(this), { wait: 10, shouldAggregate: false });

    funcs.push(this.initialize());
    Promise.all(funcs).then(() => this.markAsReady());
  }

  public async newModel(
    attributes: Partial<this['attrib']> | Partial<this['attrib']>[],
    silent: boolean = false,
  ): Promise<this> {
    if (!Array.isArray(attributes)) {
      attributes = [attributes];
    }

    const createdModels = await Promise.all(
      attributes.map((attrs) =>
        this.app
          .newModel(this.getModelType(), {
            attributes: attrs,
            collection: this,
          })
          .then((model) => {
            if (model) {
              this.add(model, true);
            }
            return model;
          }),
      ),
    );

    this.sort(undefined, silent);
    if (!silent) {
      this.emit('update', { action: 'new', models: createdModels });
    }

    return this;
  }

  public add(models: this['model'] | this['model'][], silent: boolean = false): this {
    const modelsArray = Array.isArray(models) ? models : [models];
    const itemsAdded: this['model'][] = [];

    modelsArray.forEach((model) => {
      if (this.modelRegistrationId !== model.getRegistrationId()) {
        console.error(
          `Only instances of ${
            this.modelRegistrationId
          } can be added to the collection. Attempted to add ${model.getRegistrationId()}.`,
        );
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
        model
          .setCollection(this)
          .on('change', (data: unknown) => {
            this.emit('model:change', { models: [model], data });
          })
          .on('reset', (data: unknown) => {
            this.emit('model:reset', { models: [model], data });
          })
          .on('selected', (state: unknown) => {
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
      this.emit('update', { action: 'remove', models: removedItems });
    }

    this.length = this.items.length;
    this.applyFilters();
    return removedItems;
  }

  public getModelType(): string & keyof ClassMapTypeModel {
    return this.modelRegistrationId;
  }

  public getItems(): this['model'][] {
    return this.items;
  }

  public getAttributes(): object[] {
    return this.items.map((item) => item.getAttributes());
  }

  public getAttributeKeys(): string[] {
    const ctor = this.modelConstructor as typeof Model;

    if (ctor.definition) {
      return Object.keys(ctor.definition);
    } else if (this.items.length > 0) {
      return Object.keys(this.items[0].getAttributes());
    }

    console.warn('Something went wrong... unable to determine attribute keys.');
    return [];
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

  public sort(compareFn?: (a: this['model'], b: this['model']) => number, silent: boolean = false): this {
    if (compareFn) {
      this.sortFunction = compareFn;
    } else if (!this.sortFunction) {
      const def = (this.modelConstructor as typeof Model).definition;
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

  public empty(silent: boolean = false): this {
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

  protected applyFilters() {
    if (!this.activeFilters || !this.activeFilters.length) {
      this.visibleItems = this.items;
    } else {
      this.visibleItems = this.items.filter((item) => {
        return Object.values(this.activeFilters).every((filterFn) => filterFn(item));
      });
    }

    this.visibleLength = this.visibleItems.length;
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

  public destroy(silent: boolean = false): void {
    if (this.isDestroyed) return;
    super.destroy(silent);

    this.off();
    this.empty(true);
  }
}
