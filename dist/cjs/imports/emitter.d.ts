import type Emitter from '../emitter';
export interface EmitterOptions {
    events?: string[];
}
export interface ClassConfigurationOptions<C extends Emitter> {
    defaultOptions?: C['options'];
    events?: string[];
}
export interface BaseEventArg {
    emitter: unknown;
}
export interface NormalEventArg extends BaseEventArg {
    data: any;
    ev?: CustomEvent;
}
export interface WildcardEventArg extends NormalEventArg {
    eventName: string;
}
export interface NativeEventArg extends BaseEventArg {
    ev: Event;
}
export type AnyEventArg = NormalEventArg | WildcardEventArg | NativeEventArg;
export type NormalEventHandler = (arg: NormalEventArg) => void;
export type WildcardEventHandler = (arg: WildcardEventArg) => void;
export type NativeEventHandler = (arg: NativeEventArg) => void;
export type AnyEventHandler = NormalEventHandler | WildcardEventHandler | NativeEventHandler;
export type EventHandlerApply = (this: unknown, ...arg: unknown[]) => void;
export type EventHandlerBind = (thisArg: unknown) => (arg: AnyEventArg) => void;
//# sourceMappingURL=emitter.d.ts.map