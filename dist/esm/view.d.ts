import type HarnessApp from './app';
import Emitter from './emitter';
import { Attributes } from './imports/model';
import { AttachReference, RenderOptions, ViewOptions } from './imports/view';
import Model from './model';
import { RootElement } from './util/element';
import { ErrorStateOptions } from './util/error';
export default abstract class View extends Emitter {
    static regId: string;
    static tagName: string;
    static isComponent: boolean;
    static defaultOptions: ViewOptions;
    private _viewId;
    readonly options: ViewOptions;
    protected el: RootElement;
    protected ui: {
        [key: string]: string;
    };
    private _ui;
    protected renderOptions: RenderOptions;
    protected children: {
        [id: string]: View;
    };
    protected model?: Model<Attributes>;
    isRendered: Promise<this>;
    private resolveIsRendered;
    private wasRendered;
    protected compiledTemplate?: HandlebarsTemplateDelegate;
    protected template?: string;
    protected templateWrapper?: string;
    protected errorEl?: HTMLElement;
    constructor(options: ViewOptions | undefined, app: HarnessApp);
    render(): Promise<this>;
    protected onRender(): Promise<void>;
    protected prepareRootElement(): void;
    protected attachRootElement(): void;
    appendTo(el: HTMLElement): void;
    prependTo(el: HTMLElement): void;
    detach(): HTMLElement;
    addClass(...classNames: (string | undefined)[]): this;
    removeClass(...classNames: (string | undefined)[]): this;
    removeClassByPrefix(prefix: string): this;
    swapClasses(classA: string, classB: string, condition: boolean): void;
    toggleClass(className: string, force?: boolean): void;
    getUiByIdSingle<T extends HTMLElement = HTMLElement>(id: string): T | undefined;
    getUiById<T extends HTMLElement = HTMLElement>(id: string): NodeListOf<T> | undefined;
    protected generateUiSelections(selectorAttribute?: string): void;
    protected renderTemplate(): void;
    protected getTemplateOptions(optionValues?: Record<string, unknown>): Record<string, unknown>;
    newChild<V extends View>(id: string, viewOptions: V['options']): Promise<V>;
    getChildById<T extends View>(id: string): T | undefined;
    getChildByModelId<T extends View>(id: number): T | undefined;
    protected destroyChildById(id: string): void;
    getViewId(): string;
    protected setViewId(str: string): void;
    getId(): number | undefined;
    getModel(): Model<Attributes> | undefined;
    protected setModel(): Promise<Model<Attributes> | undefined>;
    setAttributes(attributes?: Record<string, string | undefined | null>, options?: {
        dataPrefix?: boolean;
    }): this;
    setErrorState(msg: string, options?: ErrorStateOptions): void;
    protected removeErrorState(): void;
    destroy(): void;
    destroyChildren(): void;
}
export declare function isAttachReference(val: any): val is AttachReference;
//# sourceMappingURL=view.d.ts.map