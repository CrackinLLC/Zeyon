import { AnyDefinition, ClassCategory, ClassMapKey, ClassRegistryOptions, ZeyonAppLike } from 'zeyon/imports';
import { classMapData } from 'zeyonRootAlias/classMapData';
import { registryEvents } from './_events';
import Emitter from './emitter';

type ClassMapStored = Map<string, AnyDefinition>;

export default class ClassRegistry extends Emitter {
  static override registrationId: string = 'zeyon-registry';

  private classMap: ClassMapStored = new Map();
  private classMapByType: {
    Model: ClassMapStored;
    Collection: ClassMapStored;
    View: ClassMapStored;
    RouteView: ClassMapStored;
    CollectionView: ClassMapStored;
  } = {
    Model: new Map(),
    Collection: new Map(),
    View: new Map(),
    RouteView: new Map(),
    CollectionView: new Map(),
  };

  constructor(options: ClassRegistryOptions = {}, app: ZeyonAppLike) {
    super(
      {
        ...options,
        events: [...(options.events || []), ...registryEvents],
      },
      app,
    );

    // Eagerly register all classes discovered in classMapData
    for (const entry of Object.values(
      classMapData as Record<string, { classRef: AnyDefinition; type: ClassCategory }>,
    )) {
      // TODO: Entries might include classRef, but also may include fetch meta. Need to differenciate the two here?

      this.registerClass(entry.classRef, entry.type);
    }
  }

  /**
   * Registers a single class entry with the registry.
   * @param c - The constructor function to register (must have a static registrationId).
   */
  public registerClass(c: AnyDefinition, t?: ClassCategory): void {
    const id = c.registrationId;

    if (typeof c === 'function' && c.registrationId && c.prototype instanceof Emitter) {
      if (this.classMap.has(id)) {
        console.warn(`Class identifier "${id}" was overwritten in the registry.`);
      }

      this.classMap.set(id, c);

      if (t) {
        this.classMapByType[t].set(id, c);
      }

      this.emit('registered', { id });
    } else {
      console.warn(`Skipping unknown entry. It may not have registrationId or is not an Emitter-based class.`);
    }
  }

  /**
   * Retrieves a class definition from the registry.
   * @param id - The class identifier (registrationId).
   * @returns The constructor or undefined if not found.
   */
  public async getClass(id: ClassMapKey): Promise<AnyDefinition | undefined> {
    let entry = this.classMap.get(String(id));

    if (!entry) {
      entry = await this.fetchClass(id);
    }

    return entry;
  }

  /**
   * Make a request to server to retrieve a registered class that we have not yet loaded into the client
   * @param id
   * @returns
   */
  private async fetchClass(id: ClassMapKey): Promise<AnyDefinition | undefined> {
    // TODO: Use existing ClassMapEntry (import from registry imports) to determine how to fetch classRef

    // TODO: Pass fetched definition into registerClass method and await event

    // TODO: Return definition

    return undefined;
  }

  /**
   * Checks if a class is registered.
   * @param identifier - The class identifier.
   * @returns True if the class is registered, false otherwise.
   */
  public hasClass(identifier: string): boolean {
    return this.classMap.has(identifier);
  }

  /**
   * Get a set that includes registration ids of all potential classes
   * @returns
   */
  public getClassIds(type?: ClassCategory): Set<string> {
    if (type) {
      return new Set(this.classMapByType[type].keys());
    }

    return new Set(this.classMap.keys());
  }
}
