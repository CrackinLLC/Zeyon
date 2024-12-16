import { classMapData } from './generated/classMapData';
import Emitter from './emitter';
class ClassRegistry extends Emitter {
    constructor() {
        super(...arguments);
        this.classMap = new Map();
    }
    async initialize() {
        this.registerClasses(Object.values(classMapData));
    }
    registerClass(c) {
        const id = c.registrationId;
        const isOverwrite = this.classMap.has(id);
        this.classMap.set(id, c);
        if (isOverwrite) {
            this.emit('classOverwritten', { id });
            console.warn(`Class identifier "${id}" was overwritten.`);
        }
        else {
            this.emit('classRegistered', { id });
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