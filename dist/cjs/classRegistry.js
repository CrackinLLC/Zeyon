"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const classMapData_1 = require("zeyonRootAlias/classMapData");
const emitter_1 = __importDefault(require("./emitter"));
class ClassRegistry extends emitter_1.default {
    constructor(options = {}, app) {
        super({
            ...options,
            events: [...(options.events || []), 'registered'],
        }, app);
        this.classMap = new Map();
        for (const entry of Object.values(classMapData_1.classMapData)) {
            this.registerClass(entry.classRef);
        }
    }
    registerClass(c) {
        const id = c.registrationId;
        if (typeof c === 'function' && c.registrationId && c.prototype instanceof emitter_1.default) {
            if (this.classMap.has(id)) {
                console.warn(`Class identifier "${id}" was overwritten in the registry.`);
            }
            this.classMap.set(id, c);
            this.emit('registered', { id });
        }
        else {
            console.warn(`Skipping unknown entry in classMapData. It may not have registrationId or is not an Emitter-based class.`);
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
}
ClassRegistry.registrationId = 'zeyon-registry';
exports.default = ClassRegistry;
//# sourceMappingURL=classRegistry.js.map