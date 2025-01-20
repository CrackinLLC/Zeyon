import type Emitter from '../emitter';

export type NormalEventHandler =
  | ((data: any, ev?: CustomEvent) => void)
  | ((this: any, data: any, ev?: CustomEvent) => void);
export type WildcardEventHandler =
  | ((eventName: string, data: any, ev?: CustomEvent) => void)
  | ((this: any, eventName: string, data: any, ev?: CustomEvent) => void);
export type NativeEventHandler =
  | ((data: undefined, ev: Event) => void)
  | ((this: any, data: undefined, ev: Event) => void);
export type EventHandlerApply = (this: any, ...args: unknown[]) => void;
export type EventHandler = NormalEventHandler | WildcardEventHandler | NativeEventHandler;

export interface EmitterOptions {
  events?: string[];
}

export interface ClassConfigurationOptions<C extends Emitter> {
  defaultOptions?: C['options'];
  events?: string[];
}
