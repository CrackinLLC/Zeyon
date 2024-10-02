import {
  FetchCollectionOptions,
  ModelOptions,
  ModelType,
} from "./_imports/model";
import type ApplicationCore from "./app";
import type BaseCollection from "./collection";
import {
  ApiResponse,
  createData,
  deleteDataById,
  fetchDataById,
  updateDataById,
} from "./util/api";
import {
  Attributes,
  getCopy,
  getDefaultsFromDefinition,
  isEqual,
  validateAndCoerceAttributes,
} from "./util/attributes";
// import type { CachedModel } from "./controller/cacheController";
import Emitter from "./emitter";
// import { TextNotificationTheme } from "./view/notification/_imports/text";
// import type TextNotification from "./view/notification/text";

const modelEvents = [
  "add", // When the model is added to a collection.
  "remove", // When the model is removed from a collection.
  "change", // When ANY model attribute is changed.
  "reset", // When ALL model attributes are reset to their default or undefined values.
  "fetch:success", // When a fetch request is made to the server.
  "fetch:fail",
  "save:success", // When the model has been successfully been saved to the server.
  "save:fail",
  "delete:success", // When the model has been successfully deleted from the server.
  "delete:fail",
  "selected", // When the model is selected or deselected
];

// Additional generated events include [attribute]:change, [attribute]:set, and [attribute]:unset

export default class BaseModel<
  A extends Attributes = Attributes
> extends Emitter {
  static type: ModelType = ModelType.Unknown;
  static idKey = "id";

  declare Attributes: A;
  private attributes: A;
  private originalAttributes: A; // To store the state of the model when last saved or fetched
  private hasUnsavedChanges: boolean = false; // Flag to track unsaved changes
  private selected: boolean = false;

  private id: number;
  isReady: Promise<BaseModel>;

  // Reference to the collection this model instance belongs to (if applicable)
  collection: BaseCollection<BaseModel<A>> | null = null;

  constructor(
    public options: ModelOptions<A>,
    public attributeDefinition: A,
    protected app: ApplicationCore
  ) {
    const { attributes = {} as A, collection, customEvents = [] } = options;

    super({ customEvents: [...customEvents, ...modelEvents] });

    this.options = options;
    this.isReady = new Promise((resolve) => {
      this.app = app;

      const mergedAttributes = {
        ...getDefaultsFromDefinition<A>(this.attributeDefinition),
        ...attributes,
      };

      if (collection) {
        this.collection = collection;
      }

      this.set(mergedAttributes, true); // Set the merged attributes silently
      this.originalAttributes = { ...this.attributes }; // Store initial attributes as original state
      this.hasUnsavedChanges = false; // Initial state has no unsaved changes

      // Create custom events based on attributes and extend valid set
      const attributeNames = Object.keys(this.attributeDefinition);
      this.extendValidEvents(getCustomEventsFromAttributes(attributeNames));
      this.id = this.getId();

      resolve(this);
    });
  }

  private markUnsavedChanges() {
    this.hasUnsavedChanges = !this.areAttributesEqual(
      this.attributes,
      this.originalAttributes
    );
  }

  private areAttributesEqual(a: Partial<A>, b: Partial<A>): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  hasChanges(): boolean {
    return this.hasUnsavedChanges;
  }

  convertToCachedModel<M extends BaseModel = BaseModel>(): Promise<
    CachedModel<M>
  > {
    return this.app.newInstance<CachedModel<M>>("model-cache", {
      cacheController: this.app.cache,
      path: this.app.router.getCurrentPath(),
      model: this as unknown as M,
    });
  }

  set(attributes: Partial<A> = {}, silent = false): BaseModel {
    if (!attributes || Object.keys(attributes).length === 0) {
      return this;
    }

    try {
      const coercedAttributes = validateAndCoerceAttributes<A>(
        attributes,
        this.attributeDefinition,
        silent
      );

      const oldAttributes = getCopy(this.attributes);
      this.attributes = { ...this.attributes, ...coercedAttributes };

      if (!silent) {
        const changes: Record<string, any> = {};

        for (const key of Object.keys(coercedAttributes)) {
          if (!isEqual(this.attributes[key], oldAttributes[key])) {
            changes[key] = {
              value: this.attributes[key],
              previous: oldAttributes[key],
            };
          }
        }

        // If there are any changes, emit the change event with changed attributes
        if (Object.keys(changes).length > 0) {
          this.debouncedEmit<Partial<A>>("change", changes as Partial<A>);

          Object.entries(changes).forEach(([key, change]) => {
            if (change.value !== undefined && change.value !== null) {
              this.debouncedEmit<Partial<A>>(`${key}:set`, change);
            } else {
              this.debouncedEmit<Partial<A>>(`${key}:unset`, change);
            }
          });

          this.markUnsavedChanges();
        }
      }
    } catch (error) {
      this.throwError("Problem setting attributes", error);
    }

    return this;
  }

  unset(attributeName: string) {
    if (this.attributes[attributeName] !== null) {
      this.set({ [attributeName]: null } as Partial<A>);
    }
  }

  get(attributeName: string): any {
    return getCopy(this.attributes[attributeName]);
  }

  getId(): number {
    return this.get("id");
  }

  getType(): ModelType {
    return this.constructor["type"];
  }

  getAttributes() {
    return { ...this.attributes };
  }

  async save(): Promise<ApiResponse | undefined> {
    const id = this.getId();
    const payload = this.getAttributes();
    let response: ApiResponse = { ok: false };

    if (id < 1) {
      delete payload.id;
    }

    try {
      // Choose the correct API call based on whether an ID exists
      response =
        id > 0
          ? await updateDataById(this.getType(), id, payload)
          : await createData(this.getType(), payload);

      if (response.ok) {
        const savedData = response.data;

        const idKey = this.constructor["idKey"];
        if (idKey !== "id" && savedData.id) {
          savedData[idKey] = savedData.id;
          delete savedData.id;
        }

        this.set(savedData);
        this.originalAttributes = { ...this.attributes }; // Update the original state after save
        this.hasUnsavedChanges = false; // No unsaved changes after save
        this.debouncedEmit<Record<string, any>>("save:success", savedData);
      } else {
        this.throwError(
          "Problem saving data",
          response.errors?.join(", ") || "Failed to save data."
        );
        this.debouncedEmit("save:fail");
      }
    } catch (error) {
      this.throwError("Problem saving data", error);
      this.debouncedEmit("save:fail");
    }

    return response;
  }

  // Retrieves latest data from server
  async fetch(): Promise<ApiResponse | undefined> {
    const id = this.getId();

    if (!id) {
      this.throwError(
        "Problem fetching data",
        "Cannot fetch. Model hasn't been saved to the server yet."
      );
      return Promise.resolve(undefined);
    }

    try {
      const response = await fetchDataById(this.getType(), id);

      if (response.ok && response.data) {
        this.set(response.data);
        this.originalAttributes = { ...this.attributes }; // Update the original state after fetch
        this.hasUnsavedChanges = false; // No unsaved changes after fetch
        this.debouncedEmit<Partial<A>>("fetch:success", response.data);
      } else {
        this.throwError(
          "Problem fetching data",
          response.errors?.join(", ") || "Failed to fetch data."
        );
        this.debouncedEmit("fetch:fail");
      }

      return response;
    } catch (error) {
      this.throwError("Problem fetching data", error);
      this.debouncedEmit("fetch:fail");
      return undefined;
    }
  }

  async delete(): Promise<ApiResponse | undefined> {
    const id = this.getId();

    if (!id) {
      this.throwError(
        "Problem deleting data",
        "Cannot delete data without an ID."
      );
      return Promise.resolve(undefined);
    }

    try {
      const response = await deleteDataById(this.getType(), id);

      if (response.ok) {
        this.set({ [this.constructor["idKey"]]: undefined } as Partial<A>); // Clear ID after deletion
        this.debouncedEmit("delete:success", this.id);
      } else {
        this.throwError(
          "Problem deleting data",
          response.errors?.join(", ") || "Failed to delete data."
        );
        this.debouncedEmit("delete:fail", this.id);
      }

      return response;
    } catch (error) {
      this.throwError("Problem deleting data", error);
      this.debouncedEmit("delete:fail", this.id);
      return undefined;
    }
  }

  // Fetch and return an instantiated collection of models based on an attribute of this model that stores an array of IDs
  // Accepts a collectionProperty so that if the collection already exists, we return it back to caller immediately
  async fetchCollectionByIds<T extends BaseCollection>({
    collectionProperty,
    collectionName,
    idAttribute,
    force = false,
  }: FetchCollectionOptions<T>): Promise<T | null> {
    if (collectionProperty) {
      if (force) {
        collectionProperty.destroy();
        collectionProperty = null;
      } else {
        return collectionProperty;
      }
    }

    try {
      const newCollection = await this.app.newInstance<T>(collectionName);

      if (newCollection) {
        const ids: string[] | undefined = this.get(idAttribute);

        if (!ids || !ids.length) {
          console.warn(`No ${idAttribute} associated with this model.`);
        } else {
          await newCollection.newModel(ids.map((id: string) => ({ id })));
        }

        newCollection.once("destroyed", {
          handler: () => (collectionProperty = null),
          listener: this,
        });

        return newCollection;
      }

      console.warn(`Error creating collection with name: ${collectionName}.`);
      return newCollection;
    } catch (error) {
      this.throwError(
        "Problem getting collection",
        `Error fetching collection "${collectionName}" for model: ${error}`
      );
      return null;
    }
  }

  protected throwError(title: string, error?: string) {
    this.app.notificationController.load<TextNotification>("text", {
      title,
      message: error,
      theme: TextNotificationTheme.Error,
    });
    console.error(error);
    return false;
  }

  select(selected: boolean) {
    this.selected = selected;
    this.emit("selected", selected);
  }

  isSelected(): boolean {
    return this.selected;
  }

  reset(silent = false): BaseModel {
    this.set(getDefaultsFromDefinition<A>(this.attributeDefinition), silent);

    if (!silent) {
      this.emit("reset");
    }

    this.markUnsavedChanges();
    return this;
  }

  destroy() {
    this.onDestroy();

    // TODO: Need to clean up after our model (this should not affect the data stored on server)

    return;
  }

  onDestroy() {}
}

function getCustomEventsFromAttributes(attributeNames: string[]) {
  const eventTypes = ["set", "change", "unset"];
  const eventList: string[] = [];

  for (const attributeName of attributeNames) {
    for (const eventType of eventTypes) {
      eventList.push(`${attributeName}:${eventType}`);
    }
  }

  return eventList;
}
