import { AnyDefinition, ClassCategory, ClassMapKey, ClassRegistryOptions, ZeyonAppLike } from 'zeyon/imports';
import Emitter from './emitter';
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