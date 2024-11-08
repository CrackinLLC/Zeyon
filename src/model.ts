import type HarnessApp from './app';
import type Collection from './collection';
import Emitter from './emitter';
import { AttributeDefinition, AttributeType, ModelOptions, ModelType } from './imports/model';
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
 * Represents data entities with attributes, and tracks changes while emitting change related events.
 * Subclasses must provide an interface for attributes, an attributesDefinition object
 */
export default abstract class Model<
  A extends Record<string, any> = {},
  Self extends Model<A, Self> = Model<A, any>,
> extends Emitter {
  /**
   * The type of the model. Extending classes should redefine this.
   */
  public static type: ModelType = ModelType.Unknown;

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
  protected attributesDefinition: { [key in keyof A]: AttributeDefinition };

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
   * Constructs a new model instance.
   * @param options - Options for initializing the model.
   * @param app - The application core instance.
   */
  constructor(public options: ModelOptions<A, Self>, protected app: HarnessApp) {
    super({ events: [...(options.events || []), ...modelEvents] }, app);

    const { definitions, attributes = {} as Partial<A>, collection = null } = options;

    this.attributesDefinition = definitions;
    this.collection = collection;

    // Initialize attributes
    this.attributes = { ...attributes } as A;
    this.attributesOriginal = { ...this.attributes };

    // Register attribute-specific events
    this.extendValidEvents(getCustomEventsFromAttributes(Object.keys(this.attributes)));
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
    return isEqual(a, b);
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
    this.attributes = { ...this.attributes, ...this.validateAttributes(attributes) };

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
    return this.get((this.constructor as typeof Model).idKey as keyof A);
  }

  /**
   * Gets the type of the model.
   * @returns The model type.
   */
  public getType(): string {
    return (this.constructor as typeof Model).type;
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

  public getCollection(): Collection<Self> | null {
    return this.collection;
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
    super.destroy();

    if (this.collection) {
      this.collection.remove(this.getId());
      this.collection.off({ subscriber: this });
    }
  }

  /**
   * Validates and coerces attributes. Extending classes should implement this method.
   * @param attributes - The attributes to validate.
   * @returns The validated and coerced attributes.
   */
  protected validateAttributes(attributes: Partial<A>): Partial<A> {
    const validatedAttributes: Partial<A> = {};

    for (const key in attributes) {
      const definition = this.attributesDefinition[key];
      if (definition) {
        const value = attributes[key];
        validatedAttributes[key] = coerceAttribute(value, definition);
      } else {
        console.warn(`Attribute "${key}" is not defined in attributesDefinition.`);
        validatedAttributes[key] = attributes[key];
      }
    }

    return validatedAttributes;
  }
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

function coerceAttribute(value: any, definition: AttributeDefinition): any {
  if (value === undefined || value === null) {
    return definition.optional ? undefined : definition.default;
  }

  switch (definition.type) {
    case AttributeType.String:
      return String(value);
    case AttributeType.StringArray:
      return Array.isArray(value) ? value.map(String) : [];
    case AttributeType.Number:
      return Number(value);
    case AttributeType.NumberArray:
      return Array.isArray(value) ? value.map(Number) : [];
    case AttributeType.Object:
      return value; // TODO: How might object coercion work here?
    case AttributeType.ObjectArray:
      return value; // TODO: How might object coercion work here?
    case AttributeType.Boolean:
      return Boolean(value);
    case AttributeType.Date:
      return value; // TODO: How might date coercion work here?
    default:
      return value;
  }
}
