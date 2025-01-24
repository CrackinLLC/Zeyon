import type { ClassMapTypeView } from './_maps';
import Emitter from './emitter';
import { ZeyonAppLike } from './imports/app';
import { AttachReference, RenderOptions, ViewOptions } from './imports/view';
import Model from './model';
import { RootElement } from './util/element';
import { ErrorStateOptions } from './util/error';
export default abstract class View extends Emitter {
    options: ViewOptions;
    defaultOptions: ViewOptions;
    static tagName: string;
    static isComponent: boolean;
    private _viewId;
    protected el: RootElement;
    protected ui: {
        [key: string]: string;
    };
    private _ui;
    protected renderOptions: RenderOptions;
    protected children: {
        [id: string]: View;
    };
    protected model?: Model;
    isRendered: Promise<this>;
    private resolveIsRendered;
    protected hasBeenRendered: boolean;
    protected compiledTemplate?: HandlebarsTemplateDelegate;
    protected template?: string;
    protected templateWrapper?: string;
    protected errorEl?: HTMLElement;
    constructor(options: ViewOptions | undefined, app: ZeyonAppLike);
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
    findChildEl(selector: string): HTMLElement | null;
    getUiByIdSingle<T extends HTMLElement = HTMLElement>(id: string): T | undefined;
    getUiById<T extends HTMLElement = HTMLElement>(id: string): NodeListOf<T> | undefined;
    protected generateUiSelections(selectorAttribute?: string): void;
    protected renderTemplate(): void;
    protected getTemplateOptions(optionValues?: Record<string, unknown>): Record<string, unknown>;
    newChild<K extends keyof ClassMapTypeView>(registrationId: K, viewOptions: ClassMapTypeView[K]['options']): Promise<InstanceType<ClassMapTypeView[K]['classRef']>>;
    getChildById<T extends View>(id: string): T | undefined;
    getChildByModelId<T extends View>(id: number): T | undefined;
    protected destroyChildById(id: string): void;
    getViewId(): string;
    protected setViewId(str: string): void;
    getId(): number | undefined;
    getModel(): Model | undefined;
    protected setModel(): Promise<Model | undefined>;
    setAttributes(attributes?: Record<string, string | null | undefined>): this;
    setErrorState(msg: string, options?: ErrorStateOptions): void;
    protected removeErrorState(): void;
    protected isNativeEvent(eventName: string): boolean;
    destroy(silent?: boolean): void;
    destroyChildren(): void;
}
export declare function isAttachReference(val: any): val is AttachReference;
//# sourceMappingURL=view.d.ts.map