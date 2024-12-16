import type { ClassMapType } from './generated/ClassMapType';
import { ClassDefinition } from './imports/classRegistry';
import Emitter from './emitter';
export default class ClassRegistry extends Emitter {
    static registrationId: string;
    private classMap;
    initialize(): Promise<void>;
    registerClass(c: ClassDefinition): void;
    registerClasses(classes: ClassDefinition[]): void;
    getClass<T extends Emitter>(id: keyof ClassMapType): Promise<ClassDefinition<T> | undefined>;
    isClassRegistered(identifier: string): boolean;
}
//# sourceMappingURL=classRegistry.d.ts.map