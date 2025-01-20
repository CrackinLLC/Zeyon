import type { ClassMapTypeCollection, ClassMapTypeCollectionView, ClassMapTypeModel, ClassMapTypeRouteView, ClassMapTypeView } from './generated/ClassMapType';
import type { GlobalViewConfig, ZeyonAppLike, ZeyonAppOptions } from './imports/app';
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
    constructor(options: ZeyonAppOptions);
    renderGlobalView(layouts: GlobalViewConfig | GlobalViewConfig[]): this;
    start(): Promise<this>;
    navigate(urlFragment: string, openNewTab?: boolean): this;
    newView<K extends keyof ClassMapTypeView>(registrationId: K, options?: ClassMapTypeView[K]['options']): Promise<InstanceType<ClassMapTypeView[K]['definition']>>;
    newRouteView<K extends keyof ClassMapTypeRouteView>(registrationId: K, options?: ClassMapTypeRouteView[K]['options']): Promise<InstanceType<ClassMapTypeRouteView[K]['definition']>>;
    newModel<K extends keyof ClassMapTypeModel>(registrationId: K, options?: ClassMapTypeModel[K]['options']): Promise<InstanceType<ClassMapTypeModel[K]['definition']>>;
    newCollection<K extends keyof ClassMapTypeCollection>(registrationId: K, options?: ClassMapTypeCollection[K]['options']): Promise<InstanceType<ClassMapTypeCollection[K]['definition']>>;
    newCollectionView<K extends keyof ClassMapTypeCollectionView>(registrationId: K, options?: ClassMapTypeCollectionView[K]['options']): Promise<InstanceType<ClassMapTypeCollectionView[K]['definition']>>;
    private newInstance;
    toggleClass(className: string, add?: boolean): this;
    setLoadingState(show?: boolean): boolean;
}
//# sourceMappingURL=app.d.ts.map