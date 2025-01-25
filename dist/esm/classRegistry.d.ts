import type { ClassMapKey } from './_maps';
import Emitter from './emitter';
import type { ZeyonAppLike } from './imports/app';
import type { AnyDefinition, ClassRegistryOptions } from './imports/classRegistry';
export default class ClassRegistry extends Emitter {
    static registrationId: string;
    private classMap;
    constructor(options: ClassRegistryOptions | undefined, app: ZeyonAppLike);
    registerClass(c: AnyDefinition): void;
    getClass(id: ClassMapKey): Promise<AnyDefinition | undefined>;
    private fetchClass;
    hasClass(identifier: string): boolean;
}
//# sourceMappingURL=classRegistry.d.ts.map