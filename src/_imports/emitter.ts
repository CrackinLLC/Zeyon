export type CustomEventHandler = (payload: Event | CustomEvent | unknown, type?: string) => void;

export interface EmitterOptions {
  customEvents?: string[];
  includeNativeEvents?: boolean;
}
