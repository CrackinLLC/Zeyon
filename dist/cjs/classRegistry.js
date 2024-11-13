"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const emitter_1 = __importDefault(require("./emitter"));
class ClassRegistry extends emitter_1.default {
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
exports.default = ClassRegistry;
//# sourceMappingURL=classRegistry.js.map