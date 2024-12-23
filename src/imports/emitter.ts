import type Emitter from '../emitter';

export type CustomEventHandler = (ev: Event | CustomEvent, name?: string) => void;

export interface EmitterOptions {
  events?: string[];
}

export interface ClassConfigurationOptions<C extends Emitter> {
  defaultOptions?: C['options'];
  events?: string[];
}

// Native events supported by browsers. Used in view class only.
export const nativeEvents = [
  'beforeinput',
  'blur',
  'click',
  'contextmenu',
  'copy',
  'dblclick',
  'focus',
  'focusin',
  'focusout',
  'input',
  'keydown',
  'keypress',
  'keyup',
  'mousedown',
  'mouseenter',
  'mouseleave',
  'mousemove',
  'mouseout',
  'mouseover',
  'mouseup',
  'paste',
  'scroll',
];
