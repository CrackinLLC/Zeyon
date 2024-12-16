import type Model from '../model';
import type View from '../view';
import { EmitterOptions } from './emitter';
import type { Attributes } from './model';

export interface ViewOptions extends Omit<EmitterOptions, 'includeNativeEvents'> {
  id?: string;
  classNames?: string[];
  attributes?: Record<string, string | undefined>; // Inline DOM attributes, not to be confused with model attributes
  attachTo?: HTMLElement | NodeListOf<HTMLElement> | AttachReference | string;
  prepend?: boolean;
  preventDefault?: boolean; // Capture click events on view el and prevent default behavior

  params?: Record<string, string>;
  query?: Record<string, string>;
  hash?: string;

  model?: Model<Attributes> | Partial<{}> | string;
  modelType?: string; // Will attempt to infer model type based on attributes, but for ambiguous cases should explicitly state type here
}

export interface RenderOptions {
  tagName?: string; // Define a tagname override at the time of render. Allows for dynamic swapping of tags from a parent based on state or options.
}

export interface AttachReference {
  view: View; // The view to attach the element within
  id: string; // The ui id of the element to attach to
}
