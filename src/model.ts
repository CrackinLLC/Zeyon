import type ZeyonApp from './app';
import type Collection from './collection';
import Emitter from './emitter';
import { AttributeDefinition, Attributes, AttributeType, modelEvents, ModelOptions, ModelType } from './imports/model';
import { isEqual } from './util/object';

/**
 * Abstract base class for models, to represent data entities with attributes, and tracks changes while emitting change related events.
 * Ideal for managing application state and database interactions.
 */
export default abstract class Model extends Emitter {
  abstract attrib: Attributes;

  declare options: ModelOptions<this['attrib']>;
  declare defaultOptions: ModelOptions<this['attrib']>;

  /**
   * The type of the model. Extending classes should redefine this.
   */
  public static type: ModelType = ModelType.Unknown;

  /**
   * A definition that indicates particular characteristics of each attribute (e.g. value type, default, is optional, etc)
   */
  public static definition: { [key: string]: AttributeDefinition } = {};

  /**
   * The current attributes of the model.
   */
  protected attributes: this['attrib'];

  /**
   * The original attributes of the model, used for change tracking.
   */
  protected attributesOriginal: this['attrib'];

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
   * A less strict type is permitted here, as the Collection class will enforce much stricter typing of the models it works with.
   */
  private collection: Collection | null = null;

  /**
   * Constructs a new model instance.
   * @param options - Options for initializing the model.
   * @param app - The application core instance.
   */
  constructor(options: ModelOptions<Attributes>, protected app: ZeyonApp) {
    super(
      {
        ...options,
        events: [...(options.events || []), ...modelEvents],
      },
      app,
    );

    const { attributes = {} as Partial<this['attrib']>, collection } = this.options;

    // Initialize attributes
    this.attributes = { ...attributes } as this['attrib'];
    this.attributesOriginal = { ...this.attributes };

    if (collection) {
      this.setCollection(collection);
    }

    // Register attribute-specific events
    this.extendValidEvents(getCustomEventsFromAttributes(Object.keys(this.attributes)));
    this.initialize().then(() => this.markAsReady());
  }

  /**
   * Marks whether the model has unsaved changes.
   */
  protected markUnsavedChanges(): this {
    this.hasUnsavedChanges = !this.areAttributesEqual(this.attributes, this.attributesOriginal);

    return this;
  }

  /**
   * Compares two attribute objects for equality.
   * @param a - The first attributes object.
   * @param b - The second attributes object.
   * @returns True if the attributes are equal, false otherwise.
   */
  protected areAttributesEqual(a: Partial<this['attrib']>, b: Partial<this['attrib']>): boolean {
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
  public set(attributes: Partial<this['attrib']> = {}, silent: boolean = false): this {
    if (!attributes || Object.keys(attributes).length === 0) {
      return this;
    }

    const oldAttributes = { ...this.attributes };

    // Merge new attributes
    this.attributes = { ...this.attributes, ...this.validateAttributes(attributes) };

    if (!silent) {
      const changes: Partial<this['attrib']> = {};

      for (const key of Object.keys(attributes)) {
        const k = key as keyof this['attrib'];

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
  public unset(attributeName: keyof this['attrib']): this {
    if (this.attributes[attributeName] !== undefined) {
      this.set({ [attributeName]: undefined } as Partial<this['attrib']>);
    }

    return this;
  }

  /**
   * Gets the value of an attribute.
   * @param attributeName - The name of the attribute.
   * @returns The value of the attribute.
   */
  public get<T extends keyof this['attrib']>(attributeName: keyof this['attrib']): T {
    return this.attributes[attributeName] as T;
  }

  /**
   * Gets the model's id value.
   * @returns The model's ID, if defined.
   */
  public getId(): number | undefined {
    return (this.get('id') as number) || undefined;
  }

  /**
   * Gets a copy of the model's attributes.
   * @returns The attributes.
   */
  public getAttributes(): this['attrib'] {
    return { ...this.attributes };
  }

  public setCollection(collection?: Collection): this {
    if (collection && collection !== this.collection) {
      this.collection = collection;
    }

    return this;
  }

  public getCollection(): Collection | null {
    return this.collection;
  }

  /**
   * Marks the model as selected or deselected.
   * @param selected - True to select, false to deselect.
   */
  public select(selected: boolean): this {
    this.selected = selected;
    this.emit('selected', selected);

    return this;
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
  public validateAttributes(attributes: Partial<this['attrib']>): Partial<this['attrib']> {
    const validatedAttributes: Partial<this['attrib']> = {};
    const definition = (this.constructor as typeof Model).definition;

    for (const key in attributes) {
      if (Object.prototype.hasOwnProperty.call(definition, key)) {
        const value = attributes[key as keyof this['attrib']];
        validatedAttributes[key as keyof this['attrib']] = coerceAttribute(value, definition[key]);
      } else {
        console.warn(`Attribute "${key}" is not defined in attributesDefinition.`);
        validatedAttributes[key as keyof this['attrib']] = attributes[key as keyof this['attrib']];
      }
    }

    return validatedAttributes;
  }

  getType(): ModelType {
    return (this.constructor as typeof Model).type;
  }

  static getAttributeKeys(): string[] {
    return Object.keys(this.definition);
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
