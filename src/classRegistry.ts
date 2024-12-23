import { classMapData } from './generated/classMapData';
import type { ClassMapKey } from './generated/ClassMapType';
import { ZeyonAppLike } from './imports/app';
import { AnyDefinition, ClassRegistryOptions } from './imports/classRegistry';

import Emitter from './emitter';

export default class ClassRegistry extends Emitter {
  static override registrationId: string = 'zeyon-registry';

  private classMap: Map<string, AnyDefinition> = new Map();

  constructor(options: ClassRegistryOptions = {}, app: ZeyonAppLike) {
    super(
      {
        ...options,
        events: [...(options.events || []), 'registered', 'overwritten'],
      },
      app,
    );

    // TODO: Currently registers all classes, but needs to be conditional for dynamic module loading
    this.registerClasses(Object.values(classMapData));
  }

  /**
   * Registers a class definition with the registry.
   * @param c - The class definition to register.
   */
  public registerClass(c: AnyDefinition): void {
    const id = c.registrationId;
    const isOverwrite = this.classMap.has(id);

    this.classMap.set(id, c);
    if (isOverwrite) {
      // TODO: Rather than overwriting by default, require a boolean to force the overwrite, otherwise throw an error
      this.emit('overwritten', { id });
      console.warn(`Class identifier "${id}" was overwritten.`);
    } else {
      this.emit('registered', { id });
    }
  }

  public registerClasses(classes: AnyDefinition[]) {
    classes.forEach((c: AnyDefinition | unknown) => {
      if (typeof c === 'function' && (c as any).registrationId && c.prototype instanceof Emitter) {
        // c looks like a valid Definition
        this.registerClass(c as AnyDefinition);
      }
    });
  }

  /**
   * Retrieves a class definition from the registry.
   * @param identifier - The class identifier.
   * @returns The class definition or undefined if not found.
   */
  public async getClass(id: ClassMapKey): Promise<AnyDefinition | undefined> {
    const entry = this.classMap.get(String(id)) as AnyDefinition | undefined;

    if (!entry) {
      // TODO: If class is not loaded and we have API access, fetch class here
      //
      // TODO: If failed to fetch, notify user that class could not be retrieved
    }

    return entry;
  }

  /**
   * Checks if a class is registered.
   * @param identifier - The class identifier.
   * @returns True if the class is registered, false otherwise.
   */
  public isClassRegistered(identifier: string): boolean {
    return this.classMap.has(identifier);
  }
}
