import type HarnessUi from './app.ts';
import Emitter from './emitter';
import { BinaryClassDefinition, ClassRegistryOptions } from './imports/classRegistry';

export default class ClassRegistry extends Emitter {
  private classMap: Map<string, BinaryClassDefinition> = new Map();

  constructor(options: ClassRegistryOptions, app: HarnessUi) {
    super(options, app);
    Object.entries(options.registryClassList).forEach(([id, definition]) => this.classMap.set(id, definition));
  }

  registerClass(identifier: string, classDef: BinaryClassDefinition): void {
    if (this.classMap.has(identifier)) {
      throw new Error(`Class identifier "${identifier}" is already registered.`);
    }
    this.classMap.set(identifier, classDef);
  }

  createInstance<T>(identifier: string, ...args: any[]): T {
    const classDef = this.classMap.get(identifier);
    if (!classDef) {
      throw new Error(`Class identifier "${identifier}" not found.`);
    }
    return new classDef(...args) as T;
  }

  getClass(identifier: string): BinaryClassDefinition | undefined {
    return this.classMap.get(identifier);
  }
}
