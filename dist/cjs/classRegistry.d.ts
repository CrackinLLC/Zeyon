import type { ClassMapKey } from './generated/ClassMapType';
import { AnyDefinition } from './imports/classRegistry';
import Emitter from './emitter';
export default class ClassRegistry extends Emitter {
    static registrationId: string;
    private classMap;
    initialize(): Promise<void>;
    registerClass(c: AnyDefinition): void;
    registerClasses(classes: AnyDefinition[]): void;
    getClass(id: ClassMapKey): Promise<AnyDefinition | undefined>;
    isClassRegistered(identifier: string): boolean;
}
//# sourceMappingURL=classRegistry.d.ts.map