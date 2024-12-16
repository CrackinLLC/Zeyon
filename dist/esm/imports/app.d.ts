import type { ClassMapType } from '../generated/ClassMapType';
import type { ViewOptions } from './view';
export interface ZeyonAppOptions {
    name?: string;
    el: HTMLElement;
    urlPrefix: string;
}
export interface GlobalViewConfig {
    registrationId: keyof ClassMapType;
    selector: string;
    options?: ViewOptions;
}
//# sourceMappingURL=app.d.ts.map