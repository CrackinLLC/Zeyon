import type { ClassMapKey } from './_maps';
import type { ZeyonAppLike } from './imports/app';
import type {
  ClassConfigurationOptions,
  EmitterOptions,
  EventHandler,
  EventHandlerApply,
  NativeEventHandler,
  NormalEventHandler,
  WildcardEventHandler,
} from './imports/emitter';
import { debounce } from './util/debounce';

const generalEvents = [
  '*', // Triggered for all events, with an additional "event name" supplied as the first argument.
  'destroyed', // When the class instance is destroyed.
];

/**
 * The base class providing event handling capabilities.
 * Classes extending Emitter can emit and listen to events.
 */
export default abstract class Emitter {
  static [key: string]: unknown;

  static registrationId: string = '';
  static config: ClassConfigurationOptions<Emitter> = {};

  public options: EmitterOptions = {};

  /**
   * Promise that resolves once the instance is ready
   */
  public isReady: Promise<Emitter>;
  private resolveIsReady!: (value: this) => void;

  private eventListeners: { [event: string]: Listener[] } = {};
  private validEvents: Set<string> = new Set();
  private debouncedEmitters: Record<string, (...args: any[]) => void> = {};
  protected debouncedEmitterDelay: number = 50;

  protected isDestroyed: boolean = false;

  /**
   * @param options - Emitter options including custom events and whether to include native events.
   */
  constructor(options: EmitterOptions = {}, protected app: ZeyonAppLike) {
    const config = this.getStaticMember('config') as ClassConfigurationOptions<this>;

    this.options = { ...config.defaultOptions, ...options };

    const { events = [] } = this.options;

    // Initialize readiness promises
    this.isReady = new Promise<this>((resolve) => {
      this.resolveIsReady = resolve;
    });

    const eventList = [...generalEvents, ...events, ...(config.events || [])];
    this.extendValidEvents(eventList);
  }

  protected markAsReady(): void {
    this.resolveIsReady(this);
  }

  // Overridden in View classes so that they can determine if an event is native.
  // Most other classes do not interact with the DOM and so should default to false.
  protected isNativeEvent(eventName: string): boolean {
    return !!eventName && false;
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
  public extendValidEvents(events: string | string[] = []): Emitter {
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
  public on(eventName: string, handler: EventHandler, subscriber: unknown = this): Emitter {
    if (!this.validEvents.has(eventName) && eventName !== '*') {
      return this.logInvalidEvent(eventName, this);
    }

    const isNative = this.isNativeEvent(eventName);
    this.eventListeners[eventName].push(
      new Listener({
        subscriber,
        eventName,
        handler,
        el: isNative ? (this as any).el : undefined,
        isNative,
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
      handler?: EventHandler;
      subscriber?: unknown;
    } = {},
  ): Emitter {
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
  public once(event: string, handler: EventHandler, subscriber?: unknown): Emitter {
    const wrappedHandler = (...args: unknown[]) => {
      (handler as EventHandlerApply).apply(subscriber, args);
      this.off({ event, handler: wrappedHandler, subscriber });
    };

    return this.on(event, wrappedHandler, subscriber);
  }

  /**
   * Emits an event, triggering all registered handlers for that event.
   * @param event - The event name to emit.
   * @param detail - Optional data to pass to event handlers.
   * @returns The emitter instance.
   */
  public emit(eventName: string, detail?: any): Emitter {
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

  /**
   * Emits an event after a debounce delay, aggregating payloads if specified.
   * @param event - The event name to emit.
   * @param payload - Optional payload data.
   * @param shouldAggregate - Whether to aggregate multiple payloads.
   * @returns The emitter instance.
   */
  public debouncedEmit<P>(event: string, payload?: P | P[], shouldAggregate: boolean = true): Emitter {
    if (!this.debouncedEmitters[event]) {
      this.debouncedEmitters[event] = debounce(
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
  private logInvalidEvent(event: string, context: Emitter): Emitter {
    console.error(`The event "${event}" is not supported on this class.`, context);
    return this;
  }

  /**
   * Destroys all event listeners registered on this emitter.
   * @returns The emitter instance.
   */
  private destroyEvents(): Emitter {
    Object.keys(this.eventListeners).forEach((event) => {
      this.eventListeners[event].forEach((listener) => listener.destroy());
    });

    return this;
  }

  public destroy(silent: boolean = false): void {
    if (this.isDestroyed) return;

    this.isDestroyed = true;
    this.onDestroy();

    // @ts-ignore - Cleaning up for purposes of destroying the class
    this.isReady = undefined;

    if (!silent) {
      this.emit('destroyed');
    }

    this.destroyEvents();
  }

  protected onDestroy() {}

  public getStaticMember<T extends unknown>(key: string): T {
    return (this.constructor as typeof Emitter)[key] as T;
  }

  public getRegistrationId(): ClassMapKey {
    return this.getStaticMember('registrationId') as ClassMapKey;
  }
}

/**
 * Represents a single event listener.
 * Manages event handler invocation and cleanup.
 */
class Listener {
  public eventName: string;
  public handler: EventHandler;
  public subscriber: unknown;
  private el?: HTMLElement;

  private boundHandler?: EventListener;

  private isNative: boolean;
  private isWildcard: boolean;

  /**
   * Creates a new Listener instance.
   * @param options - Options for the listener.
   */
  constructor(options: {
    eventName: string;
    isNative: boolean;
    handler: EventHandler;
    subscriber?: unknown;
    el?: HTMLElement;
  }) {
    const { subscriber, eventName, handler, el, isNative } = options;
    this.subscriber = subscriber;
    this.eventName = eventName;
    this.handler = handler;
    this.el = el;
    this.isNative = isNative;

    this.isWildcard = this.eventName === '*';

    if (this.isNative) {
      // Bind the handler to the subscriber context
      this.boundHandler = (domEvent: Event) => {
        if (this.subscriber) {
          (this.handler as NativeEventHandler).call(this.subscriber, undefined, domEvent);
        } else {
          this.handler(undefined, domEvent);
        }
      };

      this.el!.addEventListener(this.eventName, this.boundHandler);
    }
  }

  /**
   * Triggers the event handler with the provided detail.
   * @param detail - Data to pass to the handler.
   * @param event - The event name (used when eventName is '*').
   * @returns The Listener instance.
   */
  public trigger(detail: any = {}, actualEventName?: string): this {
    if (this.isNative) {
      const domEvent = new Event(this.eventName);
      if (this.el) this.el.dispatchEvent(domEvent);

      // Native => (data: undefined, ev: Event) => void
      const nativeHandler = this.handler as NativeEventHandler;

      if (this.subscriber) {
        nativeHandler.call(this.subscriber, undefined, domEvent);
      } else {
        nativeHandler(undefined, domEvent);
      }
    } else if (this.isWildcard) {
      // Wildecard => (eventName: string, data: any, ev?: CustomEvent) => void
      const wildcardHandler = this.handler as WildcardEventHandler;

      const customEvent = new CustomEvent(actualEventName ?? this.eventName, { detail });
      if (this.subscriber) {
        wildcardHandler.call(this.subscriber, actualEventName || '', detail, customEvent);
      } else {
        wildcardHandler(actualEventName || '', detail, customEvent);
      }
    } else {
      // Normal => (data: any, ev?: CustomEvent) => void
      const normalHandler = this.handler as NormalEventHandler;

      const customEvent = new CustomEvent(this.eventName, { detail });
      if (this.subscriber) {
        normalHandler.call(this.subscriber, detail, customEvent);
      } else {
        normalHandler(detail, customEvent);
      }
    }

    return this;
  }

  public getIsNative(): boolean {
    return this.isNative;
  }

  /**
   * Destroys the listener, removing any attached event handlers.
   */
  public destroy(): void {
    if (this.isNative && this.el && this.boundHandler) {
      this.el.removeEventListener(this.eventName, this.boundHandler);
    }

    // Nullify properties to help with garbage collection
    this.subscriber = undefined;
    this.handler = () => {};
    this.el = undefined;
    this.boundHandler = undefined;
  }
}
