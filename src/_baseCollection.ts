import {
  BaseCollectionOptions,
  collectionEvents,
  CollectionFilterDefinition,
  CollectionFilterOptions,
  CollectionLike,
} from "../_imports/collection";
import { ModelType } from "../_imports/model";
import { fetchAllData } from "../util/api";
import type { Attributes } from "../util/attributes";
import BaseModel from "./_baseModel";
import type ApplicationCore from "./app";
import Emitter from "./emitter";

export default class BaseCollection<
    M extends BaseModel<any> = BaseModel<any>,
    F extends CollectionFilterOptions = CollectionFilterOptions
  >
  extends Emitter
  implements CollectionLike<M>
{
  private type: ModelType;

  declare model: M;
  declare filterOptions: F;
  protected activeFilters: { [key: string]: (item: M) => boolean } = {};

  private items: M[] = [];
  private visibleItems: M[] = [];

  length: number = 0;
  visibleLength: number = 0;
  isReady: Promise<BaseCollection<M>>;

  isDestroyed: boolean = false;

  constructor(
    public options: BaseCollectionOptions,
    public attributeDefinition: M["attributeDefinition"],
    protected app: ApplicationCore
  ) {
    const { ids, fetchAllData, customEvents = [] } = options;
    super({ customEvents: [...collectionEvents, ...customEvents] });

    this.isReady = new Promise(async (resolve) => {
      this.type = (this.constructor as any).type || ModelType.Unknown;

      if (ids && ids.length > 0) {
        // Call `new` and await the models' creation and fetch processes
        const newModels = await this.newModel(
          ids.map((id) => ({ id })),
          true
        );

        if (Array.isArray(newModels)) {
          // Wait for all new models to be fully fetched and added to the collection
          await Promise.all(newModels);
        }
      } else if (fetchAllData) {
        await this.fetchAll(true);
      }

      // Wait until the models have been fully fetched and added before resolving
      this.applyFilters(); // Set visible items array
      resolve(this);
    });
  }

  async newModel(
    attributes: Partial<Attributes> | Partial<Attributes>[],
    silent = false
  ): Promise<this> {
    if (!Array.isArray(attributes)) {
      attributes = [attributes];
    }

    const createOrFetchModel = async (
      attrs: Partial<Attributes>
    ): Promise<M | undefined> => {
      const id: number | undefined = attrs.id;

      if (id) {
        let existingModel = this.findById(id);

        if (existingModel) {
          await existingModel.fetch(); // Fetch model from server if it exists in the collection

          console.error("Model with this ID already exists:", existingModel);

          if (Object.keys(attrs).length > 1) {
            console.info("Extra attributes discarded:", attrs);
          }

          return existingModel;
        } else {
          const newModel = await this.app.newInstance<M>(
            `model-${this.type}`,
            {
              attributes: { id },
              collection: this,
            },
            { log: true }
          );

          if (newModel) {
            // Wait for either fetch success or failure before adding the model
            await new Promise<void>((resolve) => {
              newModel.once("fetch:success", {
                handler: () => {
                  this.add(newModel, silent); // Add the new model to the collection
                  resolve();
                },
                listener: this,
              });

              newModel.once("fetch:fail", {
                handler: () => {
                  console.error(
                    "Failed to fetch model from server, using new model:",
                    newModel
                  );
                  newModel.set(attrs);
                  this.add(newModel, silent); // Add the new model to the collection
                  resolve();
                },
                listener: this,
              });

              newModel.fetch(); // Trigger fetch request to server
            });

            return newModel;
          }
        }
      } else {
        // Create a new model and save it
        const newModel = await this.app.newInstance<M>(`model-${this.type}`, {
          attributes: attrs,
          collection: this,
        });

        if (newModel) {
          await newModel.save(); // Save the new model to the server
          this.add(newModel, silent); // Add the new model to the collection
        }

        return newModel;
      }

      return undefined;
    };

    // Process each attribute (now guaranteed to be an array)
    await Promise.all(attributes.map(createOrFetchModel));
    return this;
  }

  add(items: M | M[], silent = false): BaseCollection<M> {
    if (!Array.isArray(items)) {
      items = [items];
    }

    items.forEach((model) => {
      if (!(model instanceof BaseModel)) {
        console.error(
          'Invalid use of "add" method. Call the "new" method to add models by ID.'
        );
        return;
      }

      const existingItem = model.getId()
        ? this.findById(model.getId())
        : undefined;

      if (existingItem) {
        existingItem.set(model.getAttributes());
      } else {
        this.items.push(model);

        // TODO: Listen to all model events and emit them on the collection with the model as detail
        // model.on('all', {
        //   handler: (ev: CustomEvent, event: string) => {
        //     const detail = ev.detail;
        //     console.log('got a model event', { event, detail, model });
        //     // this.debouncedEmit(event, args);
        //   },
        //   listener: this,
        // });
      }

      if (!silent) {
        this.debouncedEmit<M>("update", [existingItem || model]);
      }
    });

    this.applyFilters(); // Refresh the visible items

    return this;
  }

  // Remove one or more items from the collection by id and return them to the caller
  remove(
    itemIds: number | number[] | undefined,
    silent = false
  ): M | M[] | undefined {
    if (itemIds === undefined) return undefined;
    const ids = Array.isArray(itemIds) ? itemIds : [itemIds];
    const removedItems: M[] = [];

    ids.forEach((id: number) => {
      const index = this.items.findIndex((item) => item.getId() === id);
      if (index > -1) {
        const [removedItem] = this.items.splice(index, 1);
        removedItems.push(removedItem);
      }
    });

    this.applyFilters(); // Refresh the visible items

    if (!silent) {
      this.debouncedEmit<M>("update", removedItems);
    }
    return removedItems.length === 1
      ? removedItems[0]
      : removedItems.length > 0
      ? removedItems
      : undefined;
  }

  getType(): ModelType {
    return this.type;
  }

  getItems(): M[] {
    return this.items;
  }

  getAttributes(): object[] {
    return this.items.map((item) => item.getAttributes());
  }

  getAttributeKeys(): string[] {
    return Object.keys(this.attributeDefinition);
  }

  getVisibleItems(): M[] {
    return this.visibleItems;
  }

  getVisibleAttributes(): object[] {
    return this.visibleItems.map((item) => item.getAttributes());
  }

  // Intentionally only returning selected items that are also visible (i.e. not filtered)
  getSelectedItems(): M[] {
    return this.visibleItems.filter((item) => item.isSelected());
  }

  getIds(): number[] {
    return this.items
      .map((item) => item.getId())
      .filter((id) => !isNaN(id) && id > -1);
  }

  getSelectedIds(): number[] {
    return this.getSelectedItems().map((item) => item.getId());
  }

  findById(itemId: number): M | undefined {
    return this.getItems().find((item) => item.getId() === itemId);
  }

  sort(compareFn: (a: M, b: M) => number) {
    this.items.sort(compareFn);
    this.applyFilters(); // Refresh the visible items

    this.emit("sort", this.visibleItems);
  }

  // Setting "extend" to false will remove all existing filters in place of new ones
  filter(filterOptions?: F, extend = true) {
    if (!extend) {
      this.activeFilters = {};
    }

    if (filterOptions) {
      Object.entries(filterOptions).forEach(([key, value]) => {
        if (![undefined, null, ""].includes(value)) {
          const filterFn = this.getFilterFunction(key, value);

          if (filterFn) {
            this.activeFilters[key] = filterFn;
          }
        } else {
          delete this.activeFilters[key];
        }
      });
    }

    this.applyFilters();
    this.emit("filter", this.visibleItems);
  }

  getFilterFunction(
    key: string,
    value: any
  ): ((item: M) => boolean) | undefined {
    if (key === "text") {
      const attributesToSearch = this.getTextSearchAttributes();

      return (item: M) => {
        const attributes = item.getAttributes();
        return attributesToSearch.some((attrKey) => {
          const attrValue = attributes[attrKey];
          return (
            attrValue &&
            String(attrValue)
              .toLowerCase()
              .includes(String(value).toLowerCase())
          );
        });
      };
    }

    return undefined;
  }

  getTextSearchAttributes(): string[] {
    if (this.items.length > 0) {
      return Object.keys(this.items[0].getAttributes());
    }

    return [];
  }

  // Retreive available filter options for this collection from its static method
  getFilterOptions() {
    const constructor = this.constructor as typeof BaseCollection;
    return constructor.getFilterOptions();
  }

  protected applyFilters() {
    this.visibleItems = this.items.filter((item: M) => {
      return Object.values(this.activeFilters).every((filterFn) =>
        filterFn(item)
      );
    });

    this.visibleLength = this.visibleItems.length;
  }

  empty() {
    this.items.forEach((item) => item.destroy()); // Clean up resources if needed
    this.items = [];

    this.debouncedEmit("update");
    this.filter({} as F, false); // Clear filters on collection
  }

  async save(): Promise<void> {
    try {
      const newModels = this.items.filter((item) => !item.getId());
      const existingModels = this.items.filter((item) => item.getId());

      if (newModels.length > 0) {
        const response = await fetch(`/data/${this.type}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newModels.map((model) => model.getAttributes())),
        });
        const savedData = await handleApiResponse(response);
        savedData.forEach((data: any, index: number) =>
          newModels[index].set(data)
        );
      }

      if (existingModels.length > 0) {
        const response = await fetch(`/data/${this.type}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            existingModels.map((model) => model.getAttributes())
          ),
        });
        await handleApiResponse(response);
      }

      this.debouncedEmit("save");
    } catch (error) {
      console.error("Error saving collection:", error);
    }
  }

  async fetch(): Promise<void> {
    const ids = this.getIds()?.filter((id) => id > 0);
    if (ids.length === 0) return;

    try {
      const response = await fetch(`/data/${this.type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      const data = await handleApiResponse(response);
      this.items = data.map((attributes: Partial<M>) =>
        this.newModel(attributes)
      );
      this.debouncedEmit<M[]>("fetch", this.items);
      this.applyFilters(); // Refresh the visible items
    } catch (error) {
      console.error("Error fetching collection:", error);
    }
  }

  async fetchAll(silent = false): Promise<void> {
    const request = await fetchAllData(this.type);

    if (request.ok) {
      const items: M[] = await Promise.all(
        request.data.map((attributes: Partial<M>) => {
          return this.app.newInstance<M>(`model-${this.type}`, {
            attributes,
            collection: this,
          });
        })
      );

      this.add(items, silent);
      this.debouncedEmit<M[]>("fetch", items);
    } else {
      console.error("Error fetching all data for collection:", this.type);
    }
  }

  destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    this.onDestroy();

    this.off();
    this.items.forEach((item) => item.destroy()); // Clean up resources if needed
    this.items = [];

    this.emit("destroyed");
  }

  onDestroy() {}

  static getFilterOptions(): CollectionFilterDefinition[] {
    return [
      {
        key: "text",
        name: "Quick search",
        textInput: true,
      },
    ];
  }
}

async function handleApiResponse(response: Response): Promise<any> {
  if (!response.ok) {
    console.error(`Error: ${response.statusText}`);
    throw new Error(response.statusText);
  }
  return await response.json();
}
