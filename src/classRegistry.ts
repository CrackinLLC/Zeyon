import { classMapData } from 'zeyonRootAlias/classMapData';
import type { ClassMapKey } from './_maps';
import Emitter from './emitter';
import type { ZeyonAppLike } from './imports/app';
import type { AnyDefinition, ClassMapEntry, ClassRegistryOptions } from './imports/classRegistry';

export default class ClassRegistry extends Emitter {
  static override registrationId: string = 'zeyon-registry';

  private classMap: Map<string, AnyDefinition> = new Map();

  constructor(options: ClassRegistryOptions = {}, app: ZeyonAppLike) {
    super(
      {
        ...options,
        events: [...(options.events || []), 'registered'],
      },
      app,
    );

    // Eagerly register all classes discovered in classMapData
    for (const entry of Object.values(classMapData)) {
      // TODO: Entries might include classRef, but also may include fetch meta. Need to differenciate the two here?

      this.registerClass((entry as ClassMapEntry).classRef);
    }
  }

  /**
   * Registers a single class entry with the registry.
   * @param c - The constructor function to register (must have a static registrationId).
   */
  public registerClass(c: AnyDefinition): void {
    const id = c.registrationId;

    if (typeof c === 'function' && c.registrationId && c.prototype instanceof Emitter) {
      if (this.classMap.has(id)) {
        console.warn(`Class identifier "${id}" was overwritten in the registry.`);
      }

      this.classMap.set(id, c);
      this.emit('registered', { id });
    } else {
      console.warn(
        `Skipping unknown entry in classMapData. It may not have registrationId or is not an Emitter-based class.`,
      );
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
}
