import type Model from '../model';
import type View from '../view';
import type { Attributes } from './model';
export interface ViewOptions {
    id?: string;
    classNames?: string[];
    attributes?: Record<string, string | undefined>;
    attachTo?: HTMLElement | NodeListOf<HTMLElement> | AttachReference | string;
    prepend?: boolean;
    events?: string[];
    preventDefault?: boolean;
    params?: Record<string, string>;
    query?: Record<string, string>;
    hash?: string;
    model?: Model<Attributes> | Partial<{}> | string;
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