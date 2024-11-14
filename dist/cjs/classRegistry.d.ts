import type ZeyonApp from './app';
import { ClassDefinition, ClassMetadata, ClassRegistryOptions } from './imports/classRegistry';
import Emitter from './emitter';
export default class ClassRegistry extends Emitter {
    private classMap;
    constructor(options: ClassRegistryOptions | undefined, app: ZeyonApp);
    registerClass(identifier: string, classDef: ClassDefinition, metadata?: ClassMetadata): void;
    getClass(identifier: string): ClassDefinition | undefined;
    isClassRegistered(identifier: string): boolean;
}
//# sourceMappingURL=classRegistry.d.ts.map