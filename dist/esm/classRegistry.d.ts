import type { ClassMapKey } from 'zeyon/_maps';
import Emitter from './emitter';
import type { ZeyonAppLike } from './imports/app';
import type { AnyDefinition, ClassRegistryOptions } from './imports/classRegistry';
export type ClassCategory = 'Model' | 'Collection' | 'View' | 'RouteView' | 'CollectionView';
export default class ClassRegistry extends Emitter {
    static registrationId: string;
    private classMap;
    private classMapByType;
    constructor(options: ClassRegistryOptions | undefined, app: ZeyonAppLike);
    registerClass(c: AnyDefinition, t?: ClassCategory): void;
    getClass(id: ClassMapKey): Promise<AnyDefinition | undefined>;
    private fetchClass;
    hasClass(identifier: string): boolean;
    getClassIds(type?: ClassCategory): Set<string>;
}
//# sourceMappingURL=classRegistry.d.ts.map