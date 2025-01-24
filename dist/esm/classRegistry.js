import { classMapData } from './_externals';
import Emitter from './emitter';
class ClassRegistry extends Emitter {
    constructor(options = {}, app) {
        super({
            ...options,
            events: [...(options.events || []), 'registered', 'overwritten'],
        }, app);
        this.classMap = new Map();
        this.registerClasses(Object.values(classMapData));
    }
    registerClass(c) {
        const id = c.registrationId;
        const isOverwrite = this.classMap.has(id);
        this.classMap.set(id, c);
        if (isOverwrite) {
            this.emit('overwritten', { id });
            console.warn(`Class identifier "${id}" was overwritten.`);
        }
        else {
            this.emit('registered', { id });
        }
    }
    registerClasses(classes) {
        classes.forEach((c) => {
            if (typeof c === 'function' && c.registrationId && c.prototype instanceof Emitter) {
                this.registerClass(c);
            }
        });
    }
    async getClass(id) {
        const entry = this.classMap.get(String(id));
        if (!entry) {
        }
        return entry;
    }
    isClassRegistered(identifier) {
        return this.classMap.has(identifier);
    }
}
ClassRegistry.registrationId = 'zeyon-registry';
export default ClassRegistry;
//# sourceMappingURL=classRegistry.js.map