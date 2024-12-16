"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const classMapData_1 = require("./generated/classMapData");
const emitter_1 = __importDefault(require("./emitter"));
class ClassRegistry extends emitter_1.default {
    constructor() {
        super(...arguments);
        this.classMap = new Map();
    }
    async initialize() {
        this.registerClasses(Object.values(classMapData_1.classMapData));
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
            if (typeof c === 'function' && c.registrationId && c.prototype instanceof emitter_1.default) {
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
exports.default = ClassRegistry;
//# sourceMappingURL=classRegistry.js.map