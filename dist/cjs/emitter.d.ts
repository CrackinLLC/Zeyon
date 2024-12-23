import type { ClassMapKey } from './generated/ClassMapType';
import { ZeyonAppLike } from './imports/app';
import { ClassConfigurationOptions, CustomEventHandler, EmitterOptions } from './imports/emitter';
export default abstract class Emitter {
    protected app: ZeyonAppLike;
    static registrationId: string;
    static config: ClassConfigurationOptions<Emitter>;
    options: EmitterOptions;
    isReady: Promise<this>;
    private resolveIsReady;
    private eventListeners;
    private validEvents;
    private debouncedEmitters;
    protected debouncedEmitterDelay: number;
    protected isDestroyed: boolean;
    constructor(options: EmitterOptions | undefined, app: ZeyonAppLike);
    protected markAsReady(): void;
    initialize(): Promise<void>;
    private rebuildListenersObject;
    extendValidEvents(events?: string | string[]): this;
    getValidEvents(): string[];
    on(event: string, handler: CustomEventHandler, subscriber?: unknown): this;
    off(options?: {
        event?: string;
        handler?: CustomEventHandler;
        subscriber?: unknown;
    }): this;
    once(event: string, handler: CustomEventHandler, subscriber?: unknown): this;
    emit(event: string, detail?: any): this;
    debouncedEmit<P>(event: string, payload?: P | P[], shouldAggregate?: boolean): this;
    private logInvalidEvent;
    private destroyEvents;
    destroy(): void;
    protected onDestroy(): void;
    getStaticMember(key: keyof typeof Emitter): unknown;
    getRegistrationId(): ClassMapKey;
}
//# sourceMappingURL=emitter.d.ts.map