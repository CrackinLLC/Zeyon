import { classMapData } from './generated/classMapData';
import type { ClassMapType } from './generated/ClassMapType';
import { ClassDefinition } from './imports/classRegistry';

import Emitter from './emitter';

export default class ClassRegistry extends Emitter {
  static override registrationId: string = 'zeyon-registry';

  private classMap: Map<string, ClassDefinition> = new Map();

  public async initialize(): Promise<void> {
    this.registerClasses(Object.values(classMapData));
  }

  /**
   * Registers a class definition with the registry.
   * @param c - The class definition to register.
   */
  public registerClass(c: ClassDefinition): void {
    const id = c.registrationId;
    const isOverwrite = this.classMap.has(id);

    this.classMap.set(id, c);
    if (isOverwrite) {
      // TODO: Rather than overwriting by default, require a boolean to force the overwrite, otherwise throw an error
      this.emit('classOverwritten', { id });
      console.warn(`Class identifier "${id}" was overwritten.`);
    } else {
      this.emit('classRegistered', { id });
    }
  }

  public registerClasses(classes: ClassDefinition[]) {
    classes.forEach((c: ClassDefinition | unknown) => {
      if (typeof c === 'function' && (c as any).registrationId && c.prototype instanceof Emitter) {
        // c looks like a valid ClassDefinition
        this.registerClass(c as ClassDefinition);
      }
    });
  }

  /**
   * Retrieves a class definition from the registry.
   * @param identifier - The class identifier.
   * @returns The class definition or undefined if not found.
   */
  public async getClass<T extends Emitter>(id: keyof ClassMapType): Promise<ClassDefinition<T> | undefined> {
    const entry = this.classMap.get(String(id)) as ClassDefinition<T> | undefined;

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
