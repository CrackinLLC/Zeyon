import type HarnessApp from './app.ts';
import { ClassDefinition, ClassEntry, ClassMetadata, ClassRegistryOptions } from './imports/classRegistry';

import Emitter from './emitter';

export default class ClassRegistry extends Emitter {
  private classMap: Map<string, ClassEntry> = new Map();

  constructor(options: ClassRegistryOptions = {}, app: HarnessApp) {
    super(options, app);

    if (options.registryClassList) {
      Object.entries(options.registryClassList).forEach(([id, classDef]) => {
        this.registerClass(id, classDef);
      });
    }
  }

  /**
   * Registers a class definition with the registry.
   * @param identifier - The unique identifier for the class.
   * @param classDef - The class definition to register.
   * @param metadata - Optional metadata for the class.
   */
  public registerClass(identifier: string, classDef: ClassDefinition, metadata: ClassMetadata = {}): void {
    const isOverwrite = this.classMap.has(identifier);
    this.classMap.set(identifier, { classDef, metadata });

    if (isOverwrite) {
      this.emit('classOverwritten', { identifier });
      console.warn(`Class identifier "${identifier}" was overwritten.`);
    } else {
      this.emit('classRegistered', { identifier });
    }
  }

  /**
   * Retrieves a class definition from the registry.
   * @param identifier - The class identifier.
   * @returns The class definition or undefined if not found.
   */
  public getClass(identifier: string): ClassDefinition | undefined {
    const entry = this.classMap.get(identifier);

    // TODO: If class is not loaded and we have API access, call this.fetch here

    return entry?.classDef;
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
