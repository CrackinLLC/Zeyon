export type CustomEventHandler = (
  ev: Event | CustomEvent,
  name?: string
) => void;

export interface EmitterOptions {
  customEvents?: string[];
  includeNativeEvents?: boolean;
}
