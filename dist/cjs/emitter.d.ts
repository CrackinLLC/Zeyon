import ZeyonApp from './app';
import type { CustomEventHandler, EmitterOptions } from './imports/emitter';
export default abstract class Emitter {
    readonly options: EmitterOptions;
    protected app: ZeyonApp;
    isReady: Promise<this>;
    private resolveIsReady;
    private eventListeners;
    private validEvents;
    private debouncedEmitters;
    protected debouncedEmitterDelay: number;
    protected isDestroyed: boolean;
    constructor(options: EmitterOptions, app: ZeyonApp);
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
}
//# sourceMappingURL=emitter.d.ts.map