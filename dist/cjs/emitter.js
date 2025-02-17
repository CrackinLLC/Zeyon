"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _events_1 = require("./_events");
const debounce_1 = require("./util/debounce");
class Emitter {
    constructor(options = {}, app) {
        this.app = app;
        this.options = {};
        this.eventListeners = {};
        this.validEvents = new Set();
        this.debouncedEmitters = {};
        this.debouncedEmitterDelay = 50;
        this.isDestroyed = false;
        const config = this.getStaticMember('config');
        this.options = { ...config.defaultOptions, ...options };
        const { events = [] } = this.options;
        this.isReady = new Promise((resolve) => {
            this.resolveIsReady = resolve;
        });
        const eventList = [..._events_1.emitterEvents, ...events, ...(config.events || [])];
        this.extendValidEvents(eventList);
    }
    markAsReady() {
        this.resolveIsReady(this);
    }
    isNativeEvent(eventName) {
        return !!eventName && false;
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
    on(eventName, handler, subscriber = this) {
        if (!this.validEvents.has(eventName) && eventName !== '*') {
            return this.logInvalidEvent(eventName, this);
        }
        const isNative = this.isNativeEvent(eventName);
        this.eventListeners[eventName].push(new Listener({
            subscriber,
            eventName,
            handler,
            el: isNative ? this.el : undefined,
            isNative,
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
        const wrappedHandler = (...args) => {
            handler.apply(subscriber, args);
            this.off({ event, handler: wrappedHandler, subscriber });
        };
        return this.on(event, wrappedHandler, subscriber);
    }
    emit(eventName, detail) {
        if (!this.validEvents.has(eventName) && eventName !== '*') {
            return this.logInvalidEvent(eventName, this);
        }
        const listeners = [...(this.eventListeners[eventName] || []), ...(this.eventListeners['*'] || [])];
        for (const listener of listeners) {
            if (!listener.getIsNative()) {
                listener.trigger(detail, eventName);
            }
        }
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
    destroy(silent = false) {
        if (this.isDestroyed)
            return;
        this.isDestroyed = true;
        this.onDestroy();
        this.isReady = undefined;
        if (!silent) {
            this.emit('destroyed');
        }
        this.destroyEvents();
    }
    onDestroy() { }
    getStaticMember(key) {
        return this.constructor[key];
    }
    getRegistrationId() {
        return this.getStaticMember('registrationId');
    }
}
Emitter.registrationId = '';
Emitter.originalName = '';
Emitter.config = {};
exports.default = Emitter;
class Listener {
    constructor(options) {
        const { subscriber, eventName, handler, el, isNative } = options;
        this.subscriber = subscriber;
        this.eventName = eventName;
        this.handler = handler;
        this.el = el;
        this.isNative = isNative;
        this.isWildcard = this.eventName === '*';
        if (this.isNative) {
            this.boundHandler = (domEvent) => {
                const nativeArg = {
                    emitter: this.subscriber ?? null,
                    ev: domEvent,
                };
                const nativeHandler = this.handler;
                if (this.subscriber) {
                    nativeHandler.call(this.subscriber, nativeArg);
                }
                else {
                    nativeHandler(nativeArg);
                }
            };
            this.el.addEventListener(this.eventName, this.boundHandler);
        }
    }
    trigger(detail = {}, actualEventName) {
        if (this.isNative) {
            const domEvent = new Event(this.eventName);
            this.el?.dispatchEvent(domEvent);
        }
        else if (this.isWildcard) {
            const wildcardHandler = this.handler;
            const customEvent = new CustomEvent(actualEventName ?? this.eventName, { detail });
            const wildcardArg = {
                emitter: this.subscriber ?? null,
                eventName: actualEventName || this.eventName,
                data: detail,
                ev: customEvent,
            };
            wildcardHandler.call(this.subscriber, wildcardArg);
        }
        else {
            const normalHandler = this.handler;
            const customEvent = new CustomEvent(this.eventName, { detail });
            const normalArg = {
                emitter: this.subscriber ?? null,
                data: detail,
                ev: customEvent,
            };
            normalHandler.call(this.subscriber, normalArg);
        }
        return this;
    }
    getIsNative() {
        return this.isNative;
    }
    destroy() {
        if (this.isNative && this.el && this.boundHandler) {
            this.el.removeEventListener(this.eventName, this.boundHandler);
        }
        this.subscriber = undefined;
        this.handler = () => { };
        this.el = undefined;
        this.boundHandler = undefined;
    }
}
//# sourceMappingURL=emitter.js.map