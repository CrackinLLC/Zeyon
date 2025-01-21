import type { ClassMapKey } from './generated/ClassMapType';
import { ZeyonAppLike } from './imports/app';
import { ClassConfigurationOptions, EmitterOptions, EventHandler } from './imports/emitter';
export default abstract class Emitter {
    protected app: ZeyonAppLike;
    static registrationId: string;
    static config: ClassConfigurationOptions<Emitter>;
    options: EmitterOptions;
    isReady: Promise<Emitter>;
    private resolveIsReady;
    private eventListeners;
    private validEvents;
    private debouncedEmitters;
    protected debouncedEmitterDelay: number;
    protected isDestroyed: boolean;
    constructor(options: EmitterOptions | undefined, app: ZeyonAppLike);
    protected markAsReady(): void;
    protected isNativeEvent(eventName: string): boolean;
    initialize(): Promise<void>;
    private rebuildListenersObject;
    extendValidEvents(events?: string | string[]): Emitter;
    getValidEvents(): string[];
    on(eventName: string, handler: EventHandler, subscriber?: unknown): Emitter;
    off(options?: {
        event?: string;
        handler?: EventHandler;
        subscriber?: unknown;
    }): Emitter;
    once(event: string, handler: EventHandler, subscriber?: unknown): Emitter;
    emit(eventName: string, detail?: any): Emitter;
    debouncedEmit<P>(event: string, payload?: P | P[], shouldAggregate?: boolean): Emitter;
    private logInvalidEvent;
    private destroyEvents;
    destroy(silent?: boolean): void;
    protected onDestroy(): void;
    getStaticMember(key: keyof typeof Emitter): unknown;
    getRegistrationId(): ClassMapKey;
}
//# sourceMappingURL=emitter.d.ts.map