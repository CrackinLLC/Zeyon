import HarnessApp from './app';
import type { CustomEventHandler, EmitterOptions } from './imports/emitter';
import { debounce } from './util/debounce';
import type { RootElement } from './util/element';

const generalEvents = [
  'all', // Triggered for all events with "type" argument supplied.
  'destroyed', // When the instance is destroyed.
];

// Native events that are supported by the browser
const nativeEvents = [
  'beforeinput', // Triggered when input is about to change.
  'blur',
  'click',
  'contextmenu', // Triggered when the right mouse button is clicked.
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
export default class Emitter {
  /**
   * A promise that resolves when the instance is ready.
   * Subclasses can set this to a promise that resolves when initialization is complete.
   */
  public isReady?: Promise<this>;

  private eventListenings: { [event: string]: Listening[] } = {};
  private validEvents: string[] = [];
  private debouncedEmitters: Record<string, (...args: any[]) => void> = {};
  protected debouncedEmitterDelay: number = 50;

  /**
   * Creates an instance of Emitter.
   * @param options - Emitter options including custom events and whether to include native events.
   */
  constructor(readonly options: EmitterOptions = {}, protected app: HarnessApp) {
    const { customEvents = [], includeNativeEvents = false } = options;

    this.validEvents = [...generalEvents, ...customEvents];

    if (includeNativeEvents) {
      this.validEvents.push(...nativeEvents);
    }

    this.rebuildListeningsObject();
  }

  /**
   * Rebuilds the event listenings object based on valid events.
   */
  private rebuildListeningsObject(): void {
    this.destroyEvents();
    this.eventListenings = {};

    this.validEvents.forEach((event) => {
      this.eventListenings[event] = this.eventListenings[event] || [];
    });
  }

  /**
   * Extends the valid events that this emitter can handle.
   * @param events - An array of event names to add.
   * @returns The emitter instance.
   */
  public extendValidEvents(events: string[] = []): this {
    this.validEvents.push(...events);
    events.forEach((event) => (this.eventListenings[event] = []));

    return this;
  }

  /**
   * Gets the list of valid events for this emitter.
   * @returns An array of valid event names.
   */
  public getValidEvents(): string[] {
    return this.validEvents;
  }

  /**
   * Registers an event handler for the specified event or events.
   * @param event - The event name or array of event names to listen to.
   * @param handler - The event handler function.
   * @param listener - Optional context for the handler.
   * @returns The emitter instance.
   */
  public on(
    event: string | string[],
    {
      handler,
      listener,
    }: {
      handler: CustomEventHandler;
      listener?: unknown;
    },
  ): this {
    // Handle array of events
    if (Array.isArray(event)) {
      event.forEach((evt) => this.on(evt, { handler, listener }));
      return this;
    }

    if (!this.validEvents.includes(event)) {
      invalidEvent(event, this);
      return this;
    }

    const listening = new Listening({
      context: this,
      listener,
      eventName: event,
      handler,
      el: (this as any)['el'] || null,
    });

    this.eventListenings[event].push(listening);

    return this;
  }

  /**
   * Unregisters event handlers.
   * If no arguments are provided, all event handlers are removed.
   * @param event - The event name to remove handlers from.
   * @param handler - The specific handler function to remove.
   * @param listener - The specific listener context to remove.
   * @param force - Disregard all other arguments and remove all handlers.
   * @returns The emitter instance.
   */
  public off({
    event,
    handler,
    listener,
    force = false,
  }: {
    event?: string;
    handler?: CustomEventHandler;
    listener?: unknown;
    force?: boolean;
  }): this {
    if (force) {
      this.destroyEvents();
      return this;
    }

    if (event === 'all') {
      this.rebuildListeningsObject();
      return this;
    }

    if (event && !this.validEvents.includes(event)) {
      invalidEvent(event, this);
      return this;
    }

    const events = event ? [event] : Object.keys(this.eventListenings);

    events.forEach((eventName) => {
      const listenings = this.eventListenings[eventName];
      if (!listenings) return;

      this.eventListenings[eventName] = listenings.filter((l) => {
        const toRemove = (!handler || l.handler === handler) && (!listener || l.listener === listener);
        if (toRemove) l.destroy();
        return !toRemove;
      });
    });

    return this;
  }

  /**
   * Registers a one-time event handler for the specified event.
   * The handler is automatically removed after the first invocation.
   * @param event - The event name to listen to.
   * @param handler - The event handler function.
   * @param listener - Optional context for the handler.
   * @returns The emitter instance.
   */
  public once(event: string, handler: CustomEventHandler, listener?: unknown): this {
    const wrappedHandler = (ev: Event | CustomEvent) => {
      handler(ev);
      this.off({ event, handler: wrappedHandler, listener });
    };

    // We have to pass in the wrapped handler so that we correctly remove it after it's been called once.
    // Otherwise the handler references don't match, and the removal fails.
    this.on(event, { handler: wrappedHandler, listener });

    return this;
  }

  /**
   * Emits an event, triggering all registered handlers for that event.
   * @param event - The event name to emit.
   * @param detail - Optional data to pass to event handlers.
   * @returns The emitter instance.
   */
  public emit(event: string, detail?: any): this {
    if (!this.validEvents.includes(event)) {
      invalidEvent(event, this);
      return this;
    }

    // Since handlers may remove themselves as listeners (e.g., once()), we clone the set before triggering.
    const listeners = [...this.eventListenings[event], ...this.eventListenings['all']];
    if (listeners) {
      listeners.forEach((listener) => listener.trigger(detail, event));
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
   * Destroys all event listeners registered on this emitter.
   * @returns The emitter instance.
   */
  private destroyEvents(): this {
    Object.keys(this.eventListenings).forEach((event) => {
      this.eventListenings[event].forEach((listener) => listener.destroy());
    });

    return this;
  }
}

/**
 * Represents a single event listener.
 * Manages event handler invocation and cleanup.
 */
class Listening {
  context: Emitter;
  listener: unknown;
  eventName: string;
  handler: CustomEventHandler;
  el: RootElement | HTMLElement | null;
  isNativeEvent: boolean;

  /**
   * Creates a new Listening instance.
   * @param options - Options for the listener.
   */
  constructor(options: {
    context: Emitter;
    listener: unknown;
    eventName: string;
    handler: CustomEventHandler;
    el: RootElement | HTMLElement | null;
  }) {
    const { context, listener, eventName, handler, el } = options;
    this.context = context;
    this.listener = listener;
    this.eventName = eventName;
    this.handler = handler;
    this.el = el;
    this.isNativeEvent = !!this.el && nativeEvents.includes(eventName);

    if (this.isNativeEvent) {
      this.el?.addEventListener(this.eventName, (ev: Event) => {
        this.handler.bind(listener)(ev);
      });
    }
  }

  /**
   * Triggers the event handler with the provided detail.
   * @param detail - Data to pass to the handler.
   * @param event - The event name.
   * @returns The Listening instance.
   */
  public trigger(detail: object = {}, event?: string): this {
    if (this.el && (this.el as any)['view'] && typeof detail === 'object') {
      (detail as any)['view'] = (this.el as any)['view'];
    }

    const customEvent = new CustomEvent(this.eventName, { detail });

    if (this.isNativeEvent) {
      this.el?.dispatchEvent(new Event(this.eventName));
    } else if (this.eventName === 'all') {
      this.handler(customEvent, event);
    } else {
      this.handler(customEvent);
    }

    return this;
  }

  /**
   * Destroys the listener, removing any attached event handlers.
   */
  public destroy(): void {
    if (this.isNativeEvent) {
      this.el?.removeEventListener(this.eventName, this.handler);
    }

    // Nullify properties to help with garbage collection
    this.listener = null;
    this.handler = () => {};
    this.el = null;
  }
}

/**
 * Logs an error for an invalid event.
 * @param event - The invalid event name.
 * @param context - The emitter context.
 */
function invalidEvent(event: string, context: Emitter): void {
  console.error(`The event "${event}" is not supported on this class.`, context);
}
