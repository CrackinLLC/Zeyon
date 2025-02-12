import type { ClassMapTypeCollection, ClassMapTypeCollectionView, ClassMapTypeModel, ClassMapTypeRouteView, ClassMapTypeView } from 'zeyon/_maps';
import type { ClassCategory } from '../classRegistry';
import type View from '../view';
import type { RouteConfig } from './router';
import { NavigateOptions } from './router';
import type { RouteViewOptions } from './routeView';
import type { ViewOptions } from './view';
export interface ZeyonAppOptions {
    el: HTMLElement;
    routes: RouteConfig[];
    name?: string;
    urlPrefix?: string;
}
export interface GlobalViewConfig {
    registrationId: keyof ClassMapTypeView;
    selector: string;
    options?: ViewOptions;
}
export interface ZeyonAppLike {
    options: ZeyonAppOptions;
    name: string;
    el: HTMLElement;
    isStarted: boolean;
    isReady: Promise<this>;
    window: Window;
    start(): Promise<this>;
    navigate(path: string, options?: NavigateOptions): this;
    newView<K extends string>(registrationId: K, options?: K extends keyof ClassMapTypeView ? ClassMapTypeView[K]['options'] : ViewOptions): Promise<K extends keyof ClassMapTypeView ? InstanceType<ClassMapTypeView[K]['classRef']> : never>;
    renderNewView<K extends string>(registrationId: K, options?: K extends keyof ClassMapTypeView ? ClassMapTypeView[K]['options'] : ViewOptions): Promise<this>;
    newRouteView<K extends string>(registrationId: K, options?: K extends keyof ClassMapTypeRouteView ? ClassMapTypeRouteView[K]['options'] : RouteViewOptions): Promise<K extends keyof ClassMapTypeRouteView ? InstanceType<ClassMapTypeRouteView[K]['classRef']> : never>;
    newModel<K extends string>(registrationId: K, options?: K extends keyof ClassMapTypeModel ? ClassMapTypeModel[K]['options'] : ViewOptions): Promise<K extends keyof ClassMapTypeModel ? InstanceType<ClassMapTypeModel[K]['classRef']> : never>;
    newCollection<K extends string>(registrationId: K, options?: K extends keyof ClassMapTypeCollection ? ClassMapTypeCollection[K]['options'] : ViewOptions): Promise<K extends keyof ClassMapTypeCollection ? InstanceType<ClassMapTypeCollection[K]['classRef']> : never>;
    newCollectionView<K extends string>(registrationId: K, options?: K extends keyof ClassMapTypeCollectionView ? ClassMapTypeCollectionView[K]['options'] : ViewOptions): Promise<K extends keyof ClassMapTypeCollectionView ? InstanceType<ClassMapTypeCollectionView[K]['classRef']> : never>;
    getClassIds(type?: ClassCategory): Set<string>;
    toggleClass(className: string, add?: boolean): this;
    setLoadingState(show?: boolean): boolean;
    loadViewStyles(view: View): this;
}
//# sourceMappingURL=app.d.ts.map