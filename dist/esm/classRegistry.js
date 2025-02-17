import { classMapData } from 'zeyonRootAlias/classMapData';
import { registryEvents } from './_events';
import Emitter from './emitter';
class ClassRegistry extends Emitter {
    constructor(options = {}, app) {
        super({
            ...options,
            events: [...(options.events || []), ...registryEvents],
        }, app);
        this.classMap = new Map();
        this.classMapByType = {
            Model: new Map(),
            Collection: new Map(),
            View: new Map(),
            RouteView: new Map(),
            CollectionView: new Map(),
        };
        for (const entry of Object.values(classMapData)) {
            this.registerClass(entry.classRef, entry.type);
        }
    }
    registerClass(c, t) {
        const id = c.registrationId;
        if (typeof c === 'function' && c.registrationId && c.prototype instanceof Emitter) {
            if (this.classMap.has(id)) {
                console.warn(`Class identifier "${id}" was overwritten in the registry.`);
            }
            this.classMap.set(id, c);
            if (t) {
                this.classMapByType[t].set(id, c);
            }
            this.emit('registered', { id });
        }
        else {
            console.warn(`Skipping unknown entry. It may not have registrationId or is not an Emitter-based class.`);
        }
    }
    async getClass(id) {
        let entry = this.classMap.get(String(id));
        if (!entry) {
            entry = await this.fetchClass(id);
        }
        return entry;
    }
    async fetchClass(id) {
        return undefined;
    }
    hasClass(identifier) {
        return this.classMap.has(identifier);
    }
    getClassIds(type) {
        if (type) {
            return new Set(this.classMapByType[type].keys());
        }
        return new Set(this.classMap.keys());
    }
}
ClassRegistry.registrationId = 'zeyon-registry';
export default ClassRegistry;
//# sourceMappingURL=classRegistry.js.map