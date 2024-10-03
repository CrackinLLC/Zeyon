import type ApplicationCore from './app';
import type Collection from './collection';
import Emitter from './emitter';
import { ModelOptions, ModelType } from './imports/model';
import { isEqual } from './util/object';

const modelEvents = [
  'add', // When the model is added to a collection.
  'remove', // When the model is removed from a collection.
  'change', // When any model attribute is changed.
  'reset', // When all model attributes are reset to their default or undefined values.
  'selected', // When the model is selected or deselected.
];
// Additional generated events include [attribute]:change, [attribute]:set, and [attribute]:unset

/**
 * Abstract base class for models.
 * Represents data entities with attributes and supports change tracking and event emission.
 */
export default abstract class Model<
  A extends Record<string, any> = {},
  Self extends Model<A, Self> = any,
> extends Emitter {
  /**
   * The type of the model. Extending classes must define this.
   */
  public type: ModelType = ModelType.Unknown;

  /**
   * The key used to identify the model's id attribute. Can be redefined in extending classes.
   */
  public static idKey: string = 'id';

  /**
   * The current attributes of the model.
   */
  protected attributes: A;

  /**
   * The original attributes of the model, used for change tracking.
   */
  protected attributesOriginal: A;

  /**
   * A definition that indicates particular characteristics of each attribute (e.g. value type, default, is optional, etc)
   */
  protected attributesDefinition: A = {} as A; // TODO: Create mechanism to define attributes

  /**
   * Flag indicating if the model has unsaved changes.
   */
  protected hasUnsavedChanges: boolean = false;

  /**
   * Flag indicating if the model is selected.
   */
  protected selected: boolean = false;

  /**
   * Reference to the collection this model belongs to, if any.
   */
  private collection: Collection<Self> | null = null;

  /**
   * A promise that resolves when the model is ready.
   */
  public isReady: Promise<this>;

  /**
   * Constructs a new model instance.
   * @param options - Options for initializing the model.
   * @param app - The application core instance.
   */
  constructor(public options: ModelOptions<A, Self>, protected app: ApplicationCore) {
    super({ customEvents: [...(options.customEvents || []), ...modelEvents] });

    const { attributes = {} as Partial<A>, collection } = options;

    this.collection = collection || null;

    // Initialize attributes
    this.attributes = { ...attributes } as A;
    this.attributesOriginal = { ...this.attributes };

    // Register attribute-specific events
    const attributeNames = Object.keys(this.attributes);
    this.extendValidEvents(getCustomEventsFromAttributes(attributeNames));

    // Initialize the isReady promise
    this.isReady = Promise.resolve(this);
  }

  /**
   * Marks whether the model has unsaved changes.
   */
  protected markUnsavedChanges(): void {
    this.hasUnsavedChanges = !this.areAttributesEqual(this.attributes, this.attributesOriginal);
  }

  /**
   * Compares two attribute objects for equality.
   * @param a - The first attributes object.
   * @param b - The second attributes object.
   * @returns True if the attributes are equal, false otherwise.
   */
  protected areAttributesEqual(a: Partial<A>, b: Partial<A>): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  /**
   * Checks if the model has unsaved changes.
   * @returns True if there are unsaved changes, false otherwise.
   */
  public hasChanges(): boolean {
    return this.hasUnsavedChanges;
  }

  /**
   * Sets attributes on the model.
   * @param attributes - The attributes to set.
   * @param silent - If true, suppresses change events.
   * @returns The model instance.
   */
  public set(attributes: Partial<A> = {}, silent: boolean = false): this {
    if (!attributes || Object.keys(attributes).length === 0) {
      return this;
    }

    const oldAttributes = { ...this.attributes };

    // Merge new attributes
    this.attributes = { ...this.attributes, ...attributes };

    if (!silent) {
      const changes: Partial<A> = {};

      for (const key of Object.keys(attributes)) {
        const k = key as keyof A;

        if (!isEqual(this.attributes[k], oldAttributes[k])) {
          changes[k] = this.attributes[k];
          const keyStr = k.toString();

          // Emit attribute-specific events
          this.emit(`${keyStr}:change`, {
            value: this.attributes[k],
            previous: oldAttributes[k],
          });

          if (this.attributes[k] !== undefined && this.attributes[k] !== null) {
            this.emit(`${keyStr}:set`, {
              value: this.attributes[k],
              previous: oldAttributes[k],
            });
          } else {
            this.emit(`${keyStr}:unset`, {
              value: this.attributes[k],
              previous: oldAttributes[k],
            });
          }
        }
      }

      if (Object.keys(changes).length > 0) {
        this.emit('change', changes);
        this.markUnsavedChanges();
      }
    }

    return this;
  }

  /**
   * Unsets (removes) an attribute from the model.
   * @param attributeName - The name of the attribute to unset.
   */
  public unset(attributeName: keyof A): void {
    if (this.attributes[attributeName] !== undefined) {
      this.set({ [attributeName]: undefined } as Partial<A>);
    }
  }

  /**
   * Gets the value of an attribute.
   * @param attributeName - The name of the attribute.
   * @returns The value of the attribute.
   */
  public get<T extends A[keyof A]>(attributeName: keyof A): T {
    return this.attributes[attributeName] as T;
  }

  /**
   * Gets the model's id value.
   * @returns The model's ID, if defined.
   */
  public getId(): number | undefined {
    return this.get(Object.getPrototypeOf(this).idKey as keyof A);
  }

  /**
   * Gets the type of the model.
   * @returns The model type.
   */
  public getType(): string {
    return Object.getPrototypeOf(this).type;
  }

  /**
   * Gets a copy of the model's attributes.
   * @returns The attributes.
   */
  public getAttributes(): A {
    return { ...this.attributes };
  }

  public setCollection(collection: Collection<Self>): void {
    this.collection = collection;
  }

  /**
   * Marks the model as selected or deselected.
   * @param selected - True to select, false to deselect.
   */
  public select(selected: boolean): void {
    this.selected = selected;
    this.emit('selected', selected);
  }

  /**
   * Checks if the model is selected.
   * @returns True if selected, false otherwise.
   */
  public isSelected(): boolean {
    return this.selected;
  }

  /**
   * Resets the model's attributes to their original values.
   * @param silent - If true, suppresses reset events.
   * @returns The model instance.
   */
  public reset(silent: boolean = false): this {
    this.attributes = { ...this.attributesOriginal };

    if (!silent) {
      this.emit('reset');
    }

    this.markUnsavedChanges();
    return this;
  }

  /**
   * Destroys the model, performing any necessary cleanup.
   */
  public destroy(): void {
    this.onDestroy();

    if (this.collection) {
      this.collection.remove(this.getId());
    }

    this.off({ force: true });
  }

  /**
   * Hook called when the model is destroyed. Subclasses can override this method.
   */
  protected onDestroy(): void {}

  /**
   * Validates and coerces attributes. Extending classes should implement this method.
   * @param attributes - The attributes to validate.
   * @returns The validated and coerced attributes.
   */
  protected abstract validateAttributes(attributes: Partial<A>): Partial<A>;
}

/**
 * Utility function to generate custom events for attribute names.
 * @param attributeNames - The attribute names.
 * @returns An array of custom event names.
 */
function getCustomEventsFromAttributes(attributeNames: string[]): string[] {
  const eventTypes = ['set', 'change', 'unset'];
  const eventList: string[] = [];

  for (const attributeName of attributeNames) {
    for (const eventType of eventTypes) {
      eventList.push(`${attributeName}:${eventType}`);
    }
  }

  return eventList;
}
