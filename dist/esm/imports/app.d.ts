import type { ClassMapKey } from '../generated/ClassMapType';
import type { ViewOptions } from './view';
export interface ZeyonAppOptions {
    name?: string;
    el: HTMLElement;
    urlPrefix: string;
}
export interface GlobalViewConfig {
    registrationId: ClassMapKey;
    selector: string;
    options?: ViewOptions;
}
//# sourceMappingURL=app.d.ts.map