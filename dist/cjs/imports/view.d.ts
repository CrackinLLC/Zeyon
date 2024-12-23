import type Model from '../model';
import type View from '../view';
import { EmitterOptions } from './emitter';
export interface ViewOptions extends Omit<EmitterOptions, 'includeNativeEvents'> {
    id?: string;
    classNames?: string[];
    attributes?: Record<string, string | undefined>;
    attachTo?: HTMLElement | NodeListOf<HTMLElement> | AttachReference | string;
    prepend?: boolean;
    preventDefault?: boolean;
    params?: Record<string, string>;
    query?: Record<string, string>;
    hash?: string;
    model?: Model | Partial<{}> | string;
    modelType?: string;
}
export interface RenderOptions {
    tagName?: string;
}
export interface AttachReference {
    view: View;
    id: string;
}
//# sourceMappingURL=view.d.ts.map