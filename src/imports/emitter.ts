export type CustomEventHandler = (ev: Event | CustomEvent, name?: string) => void;

export interface EmitterOptions {
  events?: string[];
  includeNativeEvents?: boolean;
}
