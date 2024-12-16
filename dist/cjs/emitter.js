"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debounce_1 = require("./util/debounce");
const generalEvents = [
    '*',
    'destroyed',
];
const nativeEvents = [
    'beforeinput',
    'blur',
    'click',
    'contextmenu',
    'copy',
    'dblclick',
    'focus',
    'focusin',
    'focusout',
    'input',
    'keydown',
    'keypress',
    'keyup',
    'mousedown',
    'mouseenter',
    'mouseleave',
    'mousemove',
    'mouseout',
    'mouseover',
    'mouseup',
    'paste',
    'scroll',
];
class Emitter {
    constructor(options = {}, app) {
        this.app = app;
        this.options = {};
        this.eventListeners = {};
        this.validEvents = new Set();
        this.debouncedEmitters = {};
        this.debouncedEmitterDelay = 50;
        this.isDestroyed = false;
        this.options = { ...this.constructor.defaultOptions, ...options };
        const { events = [], includeNativeEvents = false } = this.options;
        this.isReady = new Promise((resolve) => {
            this.resolveIsReady = resolve;
        });
        [...generalEvents, ...events].forEach((event) => this.validEvents.add(event));
        if (includeNativeEvents) {
            nativeEvents.forEach((event) => this.validEvents.add(event));
        }
        this.rebuildListenersObject();
    }
    markAsReady() {
        this.resolveIsReady(this);
    }
    async initialize() { }
    rebuildListenersObject() {
        this.destroyEvents();
        this.eventListeners = {};
        this.validEvents.forEach((event) => {
            this.eventListeners[event] = this.eventListeners[event] || [];
        });
    }
    extendValidEvents(events = []) {
        if (typeof events === 'string')
            events = [events];
        events.forEach((event) => {
            this.validEvents.add(event);
            if (!this.eventListeners[event]?.length) {
                this.eventListeners[event] = [];
            }
        });
        return this;
    }
    getValidEvents() {
        return [...this.validEvents.values()];
    }
    on(event, handler, subscriber = this) {
        if (!this.validEvents.has(event)) {
            return this.logInvalidEvent(event, this);
        }
        this.eventListeners[event].push(new Listener({
            subscriber,
            eventName: event,
            handler,
            el: this['el'] || null,
        }));
        return this;
    }
    off(options = {}) {
        const { event, handler, subscriber } = options;
        if (event === '*' || (!event && !handler && !subscriber)) {
            this.rebuildListenersObject();
            return this;
        }
        if (event && !this.validEvents.has(event)) {
            return this.logInvalidEvent(event, this);
        }
        const events = event ? [event] : Object.keys(this.eventListeners);
        events.forEach((eventName) => {
            const listeners = this.eventListeners[eventName];
            if (!listeners)
                return;
            this.eventListeners[eventName] = listeners.filter((l) => {
                const shouldRemove = (handler === undefined || l.handler === handler) && (subscriber === undefined || l.subscriber === subscriber);
                if (shouldRemove)
                    l.destroy();
                return !shouldRemove;
            });
        });
        return this;
    }
    once(event, handler, subscriber) {
        const wrappedHandler = (ev) => {
            handler(ev);
            this.off({ event, handler: wrappedHandler, subscriber });
        };
        this.on(event, wrappedHandler, subscriber);
        return this;
    }
    emit(event, detail) {
        if (!this.validEvents.has(event)) {
            return this.logInvalidEvent(event, this);
        }
        const listeners = [...this.eventListeners[event], ...this.eventListeners['*']];
        listeners?.forEach((listener) => listener.trigger(detail, event));
        return this;
    }
    debouncedEmit(event, payload, shouldAggregate = true) {
        if (!this.debouncedEmitters[event]) {
            this.debouncedEmitters[event] = (0, debounce_1.debounce)((aggregatedPayload, collectedPrimitives) => {
                if (aggregatedPayload && Array.isArray(aggregatedPayload) && aggregatedPayload.length > 0) {
                    this.emit(event, aggregatedPayload);
                }
                else {
                    this.emit(event, collectedPrimitives ? collectedPrimitives : undefined);
                }
                delete this.debouncedEmitters[event];
            }, {
                wait: this.debouncedEmitterDelay,
                shouldAggregate,
            });
        }
        if (payload) {
            this.debouncedEmitters[event](Array.isArray(payload) ? payload : [payload]);
        }
        else {
            this.debouncedEmitters[event]();
        }
        return this;
    }
    logInvalidEvent(event, context) {
        console.error(`The event "${event}" is not supported on this class.`, context);
        return this;
    }
    destroyEvents() {
        Object.keys(this.eventListeners).forEach((event) => {
            this.eventListeners[event].forEach((listener) => listener.destroy());
        });
        return this;
    }
    destroy() {
        if (this.isDestroyed)
            return;
        this.isDestroyed = true;
        this.onDestroy();
        this.isReady = undefined;
        this.destroyEvents();
    }
    onDestroy() { }
    getStaticMember(key) {
        return this.constructor[key];
    }
}
Emitter.registrationId = '';
Emitter.defaultOptions = {};
exports.default = Emitter;
class Listener {
    constructor(options) {
        const { subscriber, eventName, handler, el } = options;
        this.subscriber = subscriber;
        this.eventName = eventName;
        this.handler = handler;
        this.el = el;
        this.isNativeEvent = !!this.el && nativeEvents.includes(eventName);
        if (this.isNativeEvent && this.el) {
            this.boundHandler = (ev) => {
                if (this.subscriber) {
                    this.handler.call(this.subscriber, ev);
                }
                else {
                    this.handler(ev);
                }
            };
            this.el.addEventListener(this.eventName, this.boundHandler);
        }
    }
    trigger(detail = {}, event) {
        if (this.isNativeEvent) {
            if (this.el) {
                const eventObj = new Event(this.eventName);
                this.el.dispatchEvent(eventObj);
            }
        }
        else {
            const customEvent = new CustomEvent(this.eventName, { detail });
            if (this.eventName === '*') {
                this.handler(customEvent, event);
            }
            else {
                this.handler(customEvent);
            }
        }
        return this;
    }
    destroy() {
        if (this.isNativeEvent && this.el && this.boundHandler) {
            this.el.removeEventListener(this.eventName, this.boundHandler);
        }
        this.subscriber = undefined;
        this.handler = () => { };
        this.el = undefined;
        this.boundHandler = undefined;
    }
}
//# sourceMappingURL=emitter.js.map