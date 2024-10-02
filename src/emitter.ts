import type { CustomEventHandler, EmitterOptions } from "./_imports/emitter.ts";
import type { RootElement } from "./util/element.ts";
import { debounce } from "./util/throttle.ts";

// Constants for different supported event types
const generalEvents = [
  "all", // Triggered for all events.
  "destroyed", // When the instance is destroyed.
];

// Native events that are supported by the browser
const nativeEvents = [
  "beforeinput", // Triggered when input is about to change.
  "blur",
  "click",
  "contextmenu", // Triggered when the right mouse button is clicked.
  "copy",
  "dblclick",
  "focus",
  "focusin",
  "focusout",
  "input",
  "keydown",
  "keypress",
  "keyup",
  "mousedown",
  "mouseenter",
  "mouseleave",
  "mousemove",
  "mouseout",
  "mouseover",
  "mouseup",
  "paste",
  "scroll",
];

export default class Emitter {
  private eventListenings: { [event: string]: Listening[] } = {};
  private validEvents: string[] = [];
  private debouncedEmitters: Record<string, ReturnType<typeof debounce>> = {};

  protected debouncedEmitterDelay: number = 50;

  constructor(public options: EmitterOptions = {}) {
    const { customEvents = [], includeNativeEvents = false } = options;

    this.validEvents = [...generalEvents, ...customEvents];

    if (includeNativeEvents) {
      this.validEvents.push(...nativeEvents);
    }

    this.rebuildListeningsObject();
  }

  private rebuildListeningsObject() {
    this.destroyEvents();
    this.eventListenings = {};

    this.validEvents.forEach((event) => {
      this.eventListenings[event] = this.eventListenings[event] || [];
    });
  }

  extendValidEvents(events: string[] = []): Emitter {
    this.validEvents.push(...events);
    events.forEach((event) => (this.eventListenings[event] = []));

    return this;
  }

  getValidEvents(): string[] {
    return this.validEvents;
  }

  on(
    event: string | string[],
    { handler, listener }: { handler: CustomEventHandler; listener?: unknown }
  ): Emitter {
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
      el: this["el"] || null,
    });

    this.eventListenings[event].push(listening);

    return this;
  }

  // Listening is an instance of something listening to the current emitter.
  // Handler is the function attached to that listening, and listener is the caller that is currently listening for events.
  off({
    event,
    handler,
    listener,
  }: {
    event?: string;
    handler?: CustomEventHandler;
    listener?: unknown;
  } = {}): Emitter {
    if (event === "all") {
      this.rebuildListeningsObject();
      return this;
    }

    if (event && !this.validEvents.includes(event)) {
      invalidEvent(event, this);
      return this;
    }

    const events = event ? [event] : Object.keys(this.eventListenings);

    events.forEach((event) => {
      const listenings = this.eventListenings[event];
      if (!listenings) return;

      this.eventListenings[event] = listenings.filter((l) => {
        const toRemove =
          (!handler || l.handler === handler) &&
          (!listener || l.listener === listener);
        if (toRemove) l.destroy();
        return !toRemove;
      });
    });

    return this;
  }

  once(
    event: string,
    { handler, listener }: { handler: CustomEventHandler; listener?: unknown }
  ): Emitter {
    const wrappedHandler = (ev: Event | CustomEvent) => {
      handler(ev);
      this.off({ event, handler: wrappedHandler });
    };

    // We have to pass in the wrapped handler so that we correctly remove it after it's been called once.
    // Otherwise the handler references don't match, and the removal fails.
    this.on(event, { handler: wrappedHandler, listener });

    return this;
  }

  emit(event: string, detail?: any): Emitter {
    if (!this.validEvents.includes(event)) {
      invalidEvent(event, this);
      return this;
    }

    // Since handlers may remove themselves as listeners (e.g. once()), we clone the set before triggering.
    const listeners = [
      ...this.eventListenings[event],
      ...this.eventListenings["all"],
    ];
    if (listeners) {
      listeners.forEach((listener) => listener.trigger(detail, event));
    }

    return this;
  }

  debouncedEmit<P>(
    event: string,
    payload?: P | P[],
    shouldAggregate: boolean = true
  ): Emitter {
    if (!this.debouncedEmitters[event]) {
      this.debouncedEmitters[event] = debounce<P | P[]>(
        (aggregatedPayload, collectedPrimitives) => {
          // Handle cases where payload may not be provided (non-payload-specific events)
          if (
            aggregatedPayload &&
            Array.isArray(aggregatedPayload) &&
            aggregatedPayload.length > 0
          ) {
            this.emit(event, aggregatedPayload);
          } else {
            this.emit(
              event,
              collectedPrimitives ? collectedPrimitives : undefined
            ); // Emit with or without arguments
          }
          delete this.debouncedEmitters[event];
        },
        {
          wait: this.debouncedEmitterDelay,
          shouldAggregate,
        }
      );
    }

    // If payload is provided, debounce with it; otherwise, debounce the event
    if (payload) {
      this.debouncedEmitters[event](
        Array.isArray(payload) ? payload : [payload]
      );
    } else {
      this.debouncedEmitters[event]();
    }

    return this;
  }

  destroyEvents(): Emitter {
    Object.keys(this.eventListenings).forEach((event) => {
      this.eventListenings[event].forEach((listener) => listener.destroy());
    });

    return this;
  }
}

// Functional wrapper for an event handler
class Listening {
  context: Emitter;
  listener: unknown;
  eventName: string;
  handler: CustomEventHandler;
  el: RootElement | HTMLElement | null;

  isNativeEvent: boolean;

  constructor({
    context,
    listener,
    eventName,
    handler,
    el,
  }: {
    context: Emitter;
    listener: unknown;
    eventName: string;
    handler: CustomEventHandler;
    el: RootElement | HTMLElement | null;
  }) {
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

  trigger(detail: object = {}, event?: string): Listening {
    if (this.el && this.el["view"] && typeof detail === "object") {
      detail["view"] = this.el["view"];
    }

    const customEvent = new CustomEvent(this.eventName, { detail });

    if (this.isNativeEvent) {
      this.el?.dispatchEvent(new Event(this.eventName));
    } else if (this.eventName === "all") {
      this.handler(customEvent, event);
    } else {
      this.handler(customEvent);
    }

    return this;
  }

  destroy(): void {
    if (this.isNativeEvent) {
      this.el!.removeEventListener(this.eventName, this.handler);
    }

    // Nullify properties to help with garbage collection
    this.listener = null;
    this.handler = () => {};
    this.el = null;
  }
}

function invalidEvent(event: string, context: Emitter) {
  console.error(
    `The event "${event}" is not supported on this class.`,
    context
  );
}
