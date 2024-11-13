import Emitter from './emitter';
export default class ClassRegistry extends Emitter {
    constructor(options = {}, app) {
        super(options, app);
        this.classMap = new Map();
        if (options.registryClassList) {
            Object.entries(options.registryClassList).forEach(([id, classDef]) => {
                this.registerClass(id, classDef);
            });
        }
    }
    registerClass(identifier, classDef, metadata = {}) {
        const isOverwrite = this.classMap.has(identifier);
        this.classMap.set(identifier, { classDef, metadata });
        if (isOverwrite) {
            this.emit('classOverwritten', { identifier });
            console.warn(`Class identifier "${identifier}" was overwritten.`);
        }
        else {
            this.emit('classRegistered', { identifier });
        }
    }
    getClass(identifier) {
        const entry = this.classMap.get(identifier);
        return entry?.classDef;
    }
    isClassRegistered(identifier) {
        return this.classMap.has(identifier);
    }
}
//# sourceMappingURL=classRegistry.js.map