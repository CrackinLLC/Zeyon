import type View from '../view';
export interface RootElement extends HTMLElement {
    view: View;
    destroy: () => void;
}
export declare function elIsRootEl(el: Element): el is RootElement;
export declare function convertToRootElement(el: HTMLElement, context: View): RootElement;
//# sourceMappingURL=element.d.ts.map