"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const emitter_1 = __importDefault(require("./emitter"));
const model_1 = require("./imports/model");
const object_1 = require("./util/object");
class Model extends emitter_1.default {
    constructor(options, app) {
        super({
            ...options,
            events: [...(options.events || []), ...model_1.modelEvents],
        }, app);
        this.app = app;
        this.hasUnsavedChanges = false;
        this.selected = false;
        this.collection = null;
        const { attributes = {}, collection } = this.options;
        this.attributes = { ...attributes };
        this.attributesOriginal = { ...this.attributes };
        if (collection) {
            this.setCollection(collection);
        }
        this.extendValidEvents(getCustomEventsFromAttributes(Object.keys(this.attributes)));
        this.initialize().then(() => this.markAsReady());
    }
    markUnsavedChanges() {
        this.hasUnsavedChanges = !this.areAttributesEqual(this.attributes, this.attributesOriginal);
        return this;
    }
    areAttributesEqual(a, b) {
        return (0, object_1.isEqual)(a, b);
    }
    hasChanges() {
        return this.hasUnsavedChanges;
    }
    set(attributes = {}, silent = false) {
        if (!attributes || Object.keys(attributes).length === 0) {
            return this;
        }
        const oldAttributes = { ...this.attributes };
        this.attributes = { ...this.attributes, ...this.validateAttributes(attributes) };
        if (!silent) {
            const changes = {};
            for (const key of Object.keys(attributes)) {
                const k = key;
                if (!(0, object_1.isEqual)(this.attributes[k], oldAttributes[k])) {
                    changes[k] = this.attributes[k];
                    const keyStr = k.toString();
                    this.emit(`${keyStr}:change`, {
                        value: this.attributes[k],
                        previous: oldAttributes[k],
                    });
                    if (this.attributes[k] !== undefined && this.attributes[k] !== null) {
                        this.emit(`${keyStr}:set`, {
                            value: this.attributes[k],
                            previous: oldAttributes[k],
                        });
                    }
                    else {
                        this.emit(`${keyStr}:unset`, {
                            value: this.attributes[k],
                            previous: oldAttributes[k],
                        });
                    }
                }
            }
            if (Object.keys(changes).length > 0) {
                this.emit('change', changes);
                this.markUnsavedChanges();
            }
        }
        return this;
    }
    unset(attributeName) {
        if (this.attributes[attributeName] !== undefined) {
            this.set({ [attributeName]: undefined });
        }
        return this;
    }
    get(attributeName) {
        return this.attributes[attributeName];
    }
    getId() {
        return this.get('id') || undefined;
    }
    getAttributes() {
        return { ...this.attributes };
    }
    setCollection(collection) {
        if (collection && collection !== this.collection) {
            this.collection = collection;
        }
        return this;
    }
    getCollection() {
        return this.collection;
    }
    select(selected) {
        this.selected = selected;
        this.emit('selected', selected);
        return this;
    }
    isSelected() {
        return this.selected;
    }
    reset(silent = false) {
        this.attributes = { ...this.attributesOriginal };
        if (!silent) {
            this.emit('reset');
        }
        this.markUnsavedChanges();
        return this;
    }
    destroy() {
        super.destroy();
        if (this.collection) {
            this.collection.remove(this.getId());
            this.collection.off({ subscriber: this });
        }
    }
    validateAttributes(attributes) {
        const validatedAttributes = {};
        const definition = this.constructor.definition;
        for (const key in attributes) {
            if (Object.prototype.hasOwnProperty.call(definition, key)) {
                const value = attributes[key];
                validatedAttributes[key] = coerceAttribute(value, definition[key]);
            }
            else {
                console.warn(`Attribute "${key}" is not defined in attributesDefinition.`);
                validatedAttributes[key] = attributes[key];
            }
        }
        return validatedAttributes;
    }
    static getAttributeKeys() {
        return Object.keys(this.definition);
    }
}
Model.definition = {};
exports.default = Model;
function getCustomEventsFromAttributes(attributeNames) {
    const eventTypes = ['set', 'change', 'unset'];
    const eventList = [];
    for (const attributeName of attributeNames) {
        for (const eventType of eventTypes) {
            eventList.push(`${attributeName}:${eventType}`);
        }
    }
    return eventList;
}
function coerceAttribute(value, definition) {
    if (value === undefined || value === null) {
        return definition.optional ? undefined : definition.default;
    }
    switch (definition.type) {
        case 'string':
            return String(value);
        case 'stringArray':
            return Array.isArray(value) ? value.map(String) : [];
        case 'number':
            return Number(value);
        case 'numberArray':
            return Array.isArray(value) ? value.map(Number) : [];
        case 'boolean':
            return Boolean(value);
        case 'booleanArray':
            return Array.isArray(value) ? value.map(Boolean) : [];
        case 'symbol':
            return value;
        case 'symbolArray':
            return value;
        case 'object':
            return value;
        case 'objectArray':
            return value;
        case 'date':
            return value;
        case 'dateArray':
            return value;
        default:
            return value;
    }
}
//# sourceMappingURL=model.js.map