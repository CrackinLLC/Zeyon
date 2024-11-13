import HarnessApp from './app';
import type { CustomEventHandler, EmitterOptions } from './imports/emitter';
import { debounce } from './util/debounce';

const generalEvents = [
  '*', // Triggered for all events, with an additional "event type" argument supplied.
  'destroyed', // When the instance is destroyed.
];

// Native events supported by browsers. Used in view class only.
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

/**
 * The base class providing event handling capabilities.
 * Classes extending Emitter can emit and listen to events.
 */
export default abstract class Emitter {
  /**
   * Promise that resolves once the instance is ready
   */
  public isReady: Promise<this>;
  private resolveIsReady!: (value: this) => void;

  private eventListeners: { [event: string]: Listener[] } = {};
  private validEvents: Set<string> = new Set();
  private debouncedEmitters: Record<string, (...args: any[]) => void> = {};
  protected debouncedEmitterDelay: number = 50;

  protected isDestroyed: boolean = false;

  /**
   * @param options - Emitter options including custom events and whether to include native events.
   */
  constructor(public readonly options: EmitterOptions = {}, protected app: HarnessApp) {
    const { events = [], includeNativeEvents = false } = options;

    // Initialize readiness promises
    this.isReady = new Promise<this>((resolve) => {
      this.resolveIsReady = resolve;
    });

    [...generalEvents, ...events].forEach((event) => this.validEvents.add(event));
    if (includeNativeEvents) {
      nativeEvents.forEach((event) => this.validEvents.add(event));
    }

    this.rebuildListenersObject();
  }

  protected markAsReady(): void {
    this.resolveIsReady(this);
  }

  /**
   * Logic to run while the class is still initializing.
   * Subclasses should override this method and can perform asynchronous operations.
   * Initialize method will need to determine what resources are available when referencing
   * this, but generally it will be the last logic to run before isReady has resolved.
   */
  public async initialize(): Promise<void> {}

  /**
   * Rebuilds the event listeners object based on valid events.
   */
  private rebuildListenersObject(): void {
    this.destroyEvents();
    this.eventListeners = {};

    this.validEvents.forEach((event) => {
      this.eventListeners[event] = this.eventListeners[event] || [];
    });
  }

  /**
   * Extends the valid events that this emitter can handle.
   * @param events - An event name or array of event names to add.
   * @returns The emitter instance.
   */
  public extendValidEvents(events: string | string[] = []): this {
    if (typeof events === 'string') events = [events];

    events.forEach((event) => {
      this.validEvents.add(event);

      if (!this.eventListeners[event]?.length) {
        this.eventListeners[event] = [];
      }
    });

    return this;
  }

  /**
   * Gets the list of valid events for this emitter.
   * @returns An array of valid event names.
   */
  public getValidEvents(): string[] {
    return [...this.validEvents.values()];
  }

  /**
   * Registers an event handler for the specified event or events.
   * @param event - The event name or array of event names to listen to.
   * @param handler - The event handler function.
   * @param subscriber - Optional context for the handler.
   * @returns The emitter instance.
   */
  public on(event: string, handler: CustomEventHandler, subscriber: unknown = this): this {
    if (!this.validEvents.has(event)) {
      return this.logInvalidEvent(event, this);
    }

    this.eventListeners[event].push(
      new Listener({
        subscriber,
        eventName: event,
        handler,
        el: (this as any)['el'] || null,
      }),
    );

    return this;
  }

  /**
   * Unregisters event handlers.
   * If no options are provided, all event handlers are removed.
   * @param options - An object containing optional parameters:
   *   - event: The event name to remove handlers from.
   *   - handler: The specific handler function to remove.
   *   - subscriber: The specific subscribing context to remove handlers for.
   * @returns The emitter instance.
   */
  public off(
    options: {
      event?: string;
      handler?: CustomEventHandler;
      subscriber?: unknown;
    } = {},
  ): this {
    const { event, handler, subscriber } = options;

    // Special case to remove all listeners
    if (event === '*' || (!event && !handler && !subscriber)) {
      this.rebuildListenersObject();
      return this;
    }

    // Validate the event name if provided
    if (event && !this.validEvents.has(event)) {
      return this.logInvalidEvent(event, this);
    }

    // Determine which events to process
    const events = event ? [event] : Object.keys(this.eventListeners);

    events.forEach((eventName) => {
      const listeners = this.eventListeners[eventName];
      if (!listeners) return;

      // Filter out the listeners to remove based on handler and subscriber
      this.eventListeners[eventName] = listeners.filter((l) => {
        const shouldRemove =
          (handler === undefined || l.handler === handler) && (subscriber === undefined || l.subscriber === subscriber);
        if (shouldRemove) l.destroy();
        return !shouldRemove;
      });
    });

    return this;
  }

  /**
   * Registers a one-time event handler for the specified event.
   * The handler is automatically removed after the first invocation.
   * @param event - The event name to listen to.
   * @param handler - The event handler function.
   * @param subscriber - Optional context for the handler.
   * @returns The emitter instance.
   */
  public once(event: string, handler: CustomEventHandler, subscriber?: unknown): this {
    const wrappedHandler = (ev: Event | CustomEvent) => {
      handler(ev);
      this.off({ event, handler: wrappedHandler, subscriber });
    };

    // We have to pass in the wrapped handler so that we correctly remove it after it's been called once.
    // Otherwise the handler references don't match, and the removal fails.
    this.on(event, wrappedHandler, subscriber);

    return this;
  }

  /**
   * Emits an event, triggering all registered handlers for that event.
   * @param event - The event name to emit.
   * @param detail - Optional data to pass to event handlers.
   * @returns The emitter instance.
   */
  public emit(event: string, detail?: any): this {
    if (!this.validEvents.has(event)) {
      return this.logInvalidEvent(event, this);
    }

    // Since handlers may remove themselves (e.g., once()), we want to clone our references before triggering any events.
    const listeners = [...this.eventListeners[event], ...this.eventListeners['*']];
    listeners?.forEach((listener) => listener.trigger(detail, event));

    return this;
  }

  /**
   * Emits an event after a debounce delay, aggregating payloads if specified.
   * @param event - The event name to emit.
   * @param payload - Optional payload data.
   * @param shouldAggregate - Whether to aggregate multiple payloads.
   * @returns The emitter instance.
   */
  public debouncedEmit<P>(event: string, payload?: P | P[], shouldAggregate: boolean = true): this {
    if (!this.debouncedEmitters[event]) {
      this.debouncedEmitters[event] = debounce<P | P[]>(
        (aggregatedPayload, collectedPrimitives) => {
          // Handle cases where payload may not be provided (non-payload-specific events)
          if (aggregatedPayload && Array.isArray(aggregatedPayload) && aggregatedPayload.length > 0) {
            this.emit(event, aggregatedPayload);
          } else {
            this.emit(event, collectedPrimitives ? collectedPrimitives : undefined); // Emit with or without arguments
          }
          delete this.debouncedEmitters[event];
        },
        {
          wait: this.debouncedEmitterDelay,
          shouldAggregate,
        },
      );
    }

    // If payload is provided, debounce with it; otherwise, debounce the event
    if (payload) {
      this.debouncedEmitters[event](Array.isArray(payload) ? payload : [payload]);
    } else {
      this.debouncedEmitters[event]();
    }

    return this;
  }

  /**
   * Logs an error when an invalid event is encountered.
   * @param event - The invalid event name.
   * @param context - The emitter context.
   */
  private logInvalidEvent(event: string, context: Emitter): this {
    console.error(`The event "${event}" is not supported on this class.`, context);
    return this;
  }

  /**
   * Destroys all event listeners registered on this emitter.
   * @returns The emitter instance.
   */
  private destroyEvents(): this {
    Object.keys(this.eventListeners).forEach((event) => {
      this.eventListeners[event].forEach((listener) => listener.destroy());
    });

    return this;
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    this.onDestroy();

    // @ts-ignore - Cleaning up for purposes of destroying the class
    this.isReady = undefined;
    this.destroyEvents();
  }

  protected onDestroy() {}
}

/**
 * Represents a single event listener.
 * Manages event handler invocation and cleanup.
 */
class Listener {
  public eventName: string;
  public handler: CustomEventHandler;
  public subscriber: unknown;
  private el?: HTMLElement;

  private isNativeEvent: boolean;
  private boundHandler?: EventListener;

  /**
   * Creates a new Listener instance.
   * @param options - Options for the listener.
   */
  constructor(options: { eventName: string; handler: CustomEventHandler; subscriber?: unknown; el?: HTMLElement }) {
    const { subscriber, eventName, handler, el } = options;
    this.subscriber = subscriber;
    this.eventName = eventName;
    this.handler = handler;
    this.el = el;
    this.isNativeEvent = !!this.el && nativeEvents.includes(eventName);

    if (this.isNativeEvent && this.el) {
      // Bind the handler to the subscriber context
      this.boundHandler = (ev: Event) => {
        if (this.subscriber) {
          this.handler.call(this.subscriber, ev);
        } else {
          this.handler(ev);
        }
      };

      this.el.addEventListener(this.eventName, this.boundHandler);
    }
  }

  /**
   * Triggers the event handler with the provided detail.
   * @param detail - Data to pass to the handler.
   * @param event - The event name (used when eventName is '*').
   * @returns The Listener instance.
   */
  public trigger(detail: any = {}, event?: string): this {
    if (this.isNativeEvent) {
      // For native events, dispatch the event on the element
      if (this.el) {
        const eventObj = new Event(this.eventName);
        this.el.dispatchEvent(eventObj);
      }
    } else {
      // For custom events
      const customEvent = new CustomEvent(this.eventName, { detail });

      if (this.eventName === '*') {
        this.handler(customEvent, event);
      } else {
        this.handler(customEvent);
      }
    }

    return this;
  }

  /**
   * Destroys the listener, removing any attached event handlers.
   */
  public destroy(): void {
    if (this.isNativeEvent && this.el && this.boundHandler) {
      this.el.removeEventListener(this.eventName, this.boundHandler);
    }

    // Nullify properties to help with garbage collection
    this.subscriber = undefined;
    this.handler = () => {};
    this.el = undefined;
    this.boundHandler = undefined;
  }
}
