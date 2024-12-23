import type Emitter from '../emitter';
export type CustomEventHandler = (ev: Event | CustomEvent, name?: string) => void;
export interface EmitterOptions {
    events?: string[];
}
export interface ClassConfigurationOptions<C extends Emitter> {
    defaultOptions?: C['options'];
    events?: string[];
}
export declare const nativeEvents: string[];
//# sourceMappingURL=emitter.d.ts.map