import { debounce } from './util/debounce';
const generalEvents = [
    '*',
    'destroyed',
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
        const config = this.getStaticMember('config');
        this.options = { ...config.defaultOptions, ...options };
        const { events = [] } = this.options;
        this.isReady = new Promise((resolve) => {
            this.resolveIsReady = resolve;
        });
        const eventList = [...generalEvents, ...events, ...(config.events || [])];
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
            this.debouncedEmitters[event] = debounce((aggregatedPayload, collectedPrimitives) => {
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
export default Emitter;
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
                if (this.subscriber) {
                    this.handler.call(this.subscriber, undefined, domEvent);
                }
                else {
                    this.handler(undefined, domEvent);
                }
            };
            this.el.addEventListener(this.eventName, this.boundHandler);
        }
    }
    trigger(detail = {}, actualEventName) {
        if (this.isNative) {
            const domEvent = new Event(this.eventName);
            if (this.el)
                this.el.dispatchEvent(domEvent);
            const nativeHandler = this.handler;
            if (this.subscriber) {
                nativeHandler.call(this.subscriber, undefined, domEvent);
            }
            else {
                nativeHandler(undefined, domEvent);
            }
        }
        else if (this.isWildcard) {
            const wildcardHandler = this.handler;
            const customEvent = new CustomEvent(actualEventName ?? this.eventName, { detail });
            if (this.subscriber) {
                wildcardHandler.call(this.subscriber, actualEventName || '', detail, customEvent);
            }
            else {
                wildcardHandler(actualEventName || '', detail, customEvent);
            }
        }
        else {
            const normalHandler = this.handler;
            const customEvent = new CustomEvent(this.eventName, { detail });
            if (this.subscriber) {
                normalHandler.call(this.subscriber, detail, customEvent);
            }
            else {
                normalHandler(detail, customEvent);
            }
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