import type { ClassMapKey } from './_maps';
import type { ZeyonAppLike } from './imports/app';
import type { AnyEventHandler, ClassConfigurationOptions, EmitterOptions } from './imports/emitter';
export default abstract class Emitter {
    protected app: ZeyonAppLike;
    static [key: string]: unknown;
    static registrationId: string;
    static originalName: string;
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
    on(eventName: string, handler: AnyEventHandler, subscriber?: unknown): Emitter;
    off(options?: {
        event?: string;
        handler?: AnyEventHandler;
        subscriber?: unknown;
    }): Emitter;
    once(event: string, handler: AnyEventHandler, subscriber?: unknown): Emitter;
    emit(eventName: string, detail?: any): Emitter;
    debouncedEmit<P>(event: string, payload?: P | P[], shouldAggregate?: boolean): Emitter;
    private logInvalidEvent;
    private destroyEvents;
    destroy(silent?: boolean): void;
    protected onDestroy(): void;
    getStaticMember<T extends unknown>(key: string): T;
    getRegistrationId(): ClassMapKey;
}
//# sourceMappingURL=emitter.d.ts.map