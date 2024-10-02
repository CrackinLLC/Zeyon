import { EmitterOptions } from "./_imports/emitter";
import { SessionUserAttributes } from "./_imports/sessionUser";
import { loaderTemplate } from "./_imports/view";
import Emitter from "./emitter";
import type Router from "./router";
import type SessionUserModel from "./sessionUser";
import type { BinaryClass, BinaryClassDefinition } from "./util/types";

// import CacheController from './controller/cacheController';
// import DialogController from './controller/dialogController';
// import NotificationController from './controller/notificationController';
// import TipController from './controller/tipController';
// import ValidationController from './controller/validationController';

declare global {
  interface Window {
    APP: ApplicationCore;
    dataOnLoad: {
      sessionuser: SessionUserAttributes;
    };
    model: { [name: string]: any };
  }
}

export interface ApplicationOptions extends EmitterOptions {
  name?: string;
  user: SessionUserAttributes;
  router: Router;
  header?: string;
  sidebar?: string;
  classMap: Map<string, BinaryClassDefinition>;
}

// const controllers: { [id: string]: ControllerDefinition } = {
//   'controller-dialog': DialogController,
//   'controller-notification': NotificationController,
//   'controller-tip': TipController,
//   'controller-validation': ValidationController,
//   'controller-cache': CacheController,
// };

export default class ApplicationCore extends Emitter {
  started = false;

  name = ""; // Identifier for the current application running.
  user: SessionUserModel;
  router: Router;
  // cache: CacheController;
  // sidebar: BaseView | undefined;
  // header: BaseView | undefined;

  // TODO: Replace map storage method with server request by binaryId
  private classMap: Map<string, BinaryClassDefinition>;

  sectionElement: HTMLElement;
  private bodyClassList = document.body.classList;
  private loadingState: HTMLElement | null = null;

  // dialogController: DialogController;
  // notificationController: NotificationController;
  // tipController: TipController;

  isReady: Promise<ApplicationCore>;

  constructor(public options: ApplicationOptions) {
    const { name, user, router, header, sidebar, classMap } = options;

    super({ customEvents: ["loaded:screen", "loaded:section", "click"] });

    if (name) {
      this.name = name;
    }

    this.router = router;
    this.classMap = classMap;
    this.sectionElement = document.querySelector("#Views") as HTMLElement;

    this.isReady = new Promise(async (resolve) => {
      // Object.entries(controllers).forEach(([id, def]) =>
      //   this.classMap.set(id, def)
      // );

      const loading: Promise<unknown>[] = [];

      loading.push(
        this.newInstance<SessionUserModel>("model-sessionuser", {
          attributes: user,
        }).then((user) => (this.user = user))
        // this.newInstance<CacheController>("controller-cache", {
        //   currentPath: this.router.getCurrentPath(),
        // }).then((cache) => (this.cache = cache)),
        // this.newInstance<DialogController>("controller-dialog").then(
        //   (dialogController) => (this.dialogController = dialogController)
        // ),
        // this.newInstance<NotificationController>(
        //   "controller-notification"
        // ).then(
        //   (notificationController) =>
        //     (this.notificationController = notificationController)
        // ),
        // this.newInstance<TipController>("controller-tip").then(
        //   (tipController) => (this.tipController = tipController)
        // )
      );

      // if (header) {
      //   loading.push(
      //     this.newInstance<BaseView>(header, {
      //       attachTo: document.querySelector("#Header") as HTMLElement,
      //     }).then((header) => (this.header = header))
      //   );
      // }

      // if (sidebar) {
      //   loading.push(
      //     this.newInstance<BaseView>(sidebar, {
      //       attachTo: document.querySelector("#Sidebar") as HTMLElement,
      //     }).then((sidebar) => (this.sidebar = sidebar))
      //   );
      // }

      await Promise.all(loading);

      this.user.on(["login", "logout"], {
        handler: () =>
          this.toggleGlobalClass("is-loggedin", this.user.isLoggedIn()),
        listener: this,
      });
      this.toggleGlobalClass("is-loggedin", this.user.isLoggedIn());

      resolve(this);
    });
  }

  async initialize() {
    await this.isReady;

    if (!this.started) {
      this.started = true;

      // const navigationHandler: CustomEventHandler = (event: Event | CustomEvent, type?: string) => {
      //   if (event.detail?.sectionConfig) {
      //     // this.cache.clearAll();
      //   }
      // }

      this.router.start(this);
      // this.router.on("navigate", {
      //   handler: navigationHandler,
      //   listener: this,
      // });

      // if (this.sidebar) {
      //   this.sidebar.render();
      // }

      // if (this.header) {
      //   this.header.render();
      // }

      document.body.addEventListener("click", (ev) => this.emit("click", ev));
    }

    return this;
  }

  navigate(urlFragment: string, openNewTab = false) {
    const baseUrl = new URL(document.baseURI);
    const url = new URL(urlFragment, baseUrl);

    if (url.origin !== baseUrl.origin || openNewTab) {
      const a = document.createElement("a");
      a.href = urlFragment;
      a.setAttribute("target", "_blank");
      a.click();
    } else {
      this.router.navigate({ path: urlFragment });
    }
  }

  // Used to instantiate a new class and returns the instantiated instance.
  async newInstance<B extends BinaryClass>(
    id: string,
    options: B["options"] = {},
    ...more: unknown[]
  ): Promise<B> {
    const def = this.classMap.get(id) as BinaryClassDefinition;

    if (def) {
      try {
        const instance = new def(options, this, ...more) as B;
        return (instance["isReady"] || instance) as Promise<B>;
      } catch (e: unknown) {
        console.error(new Error(`Failed to instantiate new class!! ${id}`));
        console.error(e);
        throw e;
      }
    } else {
      const errorMessage = `Failed to locate class!! ${id}`;
      const error = new Error(errorMessage);
      console.error(error);
      throw error;
    }
  }

  toggleGlobalClass(className: string, add?: boolean) {
    this.bodyClassList.toggle(className, add);
    return this;
  }

  setLoadingState(show?: boolean): boolean {
    if (show === undefined) {
      show = !this.loadingState;
    }

    if (show && !this.loadingState) {
      this.loadingState = loaderTemplate({ wrapped: true });
      this.sectionElement.appendChild(this.loadingState);
    } else if (!show && this.loadingState) {
      this.loadingState.remove();
      this.loadingState = null;
    }

    return show;
  }
}
