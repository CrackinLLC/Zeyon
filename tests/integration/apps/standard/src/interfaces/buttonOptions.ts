import { NativeEventHandler, ViewOptions } from 'zeyon';

export interface ButtonOptions extends ViewOptions {
  label: string;
  href?: string;
  onClick?: NativeEventHandler;
}
