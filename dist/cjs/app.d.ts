import { Attributes, ClassCategory, ClassMapTypeCollection, ClassMapTypeCollectionView, ClassMapTypeModel, ClassMapTypeRouteView, ClassMapTypeView, CollectionOptions, CollectionViewOptions, ModelOptions, NavigateOptions, RouteViewOptions, ViewOptions, ZeyonAppLike, ZeyonAppOptions } from 'zeyon/imports';
import type View from './view';
export default class ZeyonApp implements ZeyonAppLike {
    options: ZeyonAppOptions;
    name: string;
    el: HTMLElement;
    isStarted: boolean;
    isReady: Promise<this>;
    private resolveIsReady;
    window: Window;
    private router;
    private registry;
    private loadingState;
    private stylesLoaded;
    constructor(options: ZeyonAppOptions);
    start(): Promise<this>;
    navigate(options?: NavigateOptions): this;
    newView<K extends string>(registrationId: K, options?: K extends keyof ClassMapTypeView ? ClassMapTypeView[K]['options'] : ViewOptions): Promise<K extends keyof ClassMapTypeView ? InstanceType<ClassMapTypeView[K]['classRef']> : never>;
    renderNewView<K extends string>(registrationId: K, options?: K extends keyof ClassMapTypeView ? ClassMapTypeView[K]['options'] : ViewOptions): Promise<this>;
    newRouteView<K extends string>(registrationId: K, options?: K extends keyof ClassMapTypeRouteView ? ClassMapTypeRouteView[K]['options'] : RouteViewOptions): Promise<K extends keyof ClassMapTypeRouteView ? InstanceType<ClassMapTypeRouteView[K]['classRef']> : never>;
    newModel<K extends string>(registrationId: K, options?: K extends keyof ClassMapTypeModel ? ClassMapTypeModel[K]['options'] : ModelOptions<Attributes>): Promise<K extends keyof ClassMapTypeModel ? InstanceType<ClassMapTypeModel[K]['classRef']> : never>;
    newCollection<K extends string>(registrationId: K, options?: K extends keyof ClassMapTypeCollection ? ClassMapTypeCollection[K]['options'] : CollectionOptions): Promise<K extends keyof ClassMapTypeCollection ? InstanceType<ClassMapTypeCollection[K]['classRef']> : never>;
    newCollectionView<K extends string>(registrationId: K, options?: K extends keyof ClassMapTypeCollectionView ? ClassMapTypeCollectionView[K]['options'] : CollectionViewOptions): Promise<K extends keyof ClassMapTypeCollectionView ? InstanceType<ClassMapTypeCollectionView[K]['classRef']> : never>;
    private newInstance;
    getClassIds(type?: ClassCategory): Set<string>;
    toggleClass(className: string, add?: boolean): this;
    setLoadingState(show?: boolean): boolean;
    loadViewStyles(view: View): this;
}
//# sourceMappingURL=app.d.ts.map