import type {
  NavigateEventPayload,
  RouterOptions,
  ScreenConfig,
  ScreenMap,
  SectionConfig,
  UrlMap,
  UrlMapEntry,
} from "./_imports/router";
import type ApplicationCore from "./app";
import Emitter from "./emitter";
import type BaseView from "./view";
// import type TextNotification from "./view/notification/text";

export default class Router extends Emitter {
  private currentSectionId: string;
  private currentScreenId: string;
  private currentScreenView: BaseView | undefined;
  private currentPath: string = "";

  private window: Window;
  private app: ApplicationCore;
  private screenMap: ScreenMap;
  private urlMap: UrlMap = {};
  private defaultUrl: string | undefined;
  private baseUrl: string | undefined;

  constructor({ screenMap, window, baseUrl, defaultUrl }: RouterOptions) {
    super({
      customEvents: [
        "navigate", // New section or screen is loaded
        "query", // Query parameter is changed
      ],
    });

    this.screenMap = screenMap;
    this.window = window;
    this.currentPath = this.standardizeUrl(
      new URL(this.window.location.href).pathname
    );

    if (defaultUrl) {
      this.defaultUrl = defaultUrl;
    }

    if (baseUrl) {
      this.baseUrl = baseUrl;
    }

    // The supplementory UrlMap is derived from the ScreenMap, and used to help
    // optimize other operations below without spending additional cycles.
    Object.entries(this.screenMap).forEach(([section, { screens }]) => {
      screens.forEach((screen) => {
        this.urlMap[this.standardizeUrl(screen.url)] = {
          view: screen.view,
          sectionId: section,
          screenId: screen.id,
        };
      });
    });
  }

  start(app: ApplicationCore) {
    this.app = app;
    this.window.addEventListener("popstate", () => this.loadScreenFromUrl());
    this.navigate({ preserveQuery: true, force: true }); // Load initial screen view

    this.app.user.on("logout", {
      handler: () => this.navigate({ path: "/", force: true }),
    });
  }

  // Pushes a new url into history stack
  async navigate({
    path = this.window.location.pathname,
    preserveQuery = false,
    force = false,
  }: {
    path?: string;
    preserveQuery?: boolean;
    force?: boolean;
  }) {
    path = this.standardizeUrl(path);

    // Hook to allow a view to prevent navigation if needed
    let canProceed = true;
    if (this.currentScreenView) {
      // If the current screen includes a beforeNavigate method, call it and wait on it to allow pages to prevent navigation if needed
      canProceed = await this.currentScreenView.beforeNavigate(path);
    }
    if (!canProceed) return;

    if (path !== "/" && !this.isUserLoggedIn()) {
      // Notify the user and redirect to root if not logged in
      this.notifyUserToLogIn();
      return this.navigate({ path: "/" });
    } else if (path === "/" && this.isUserLoggedIn()) {
      return this.navigate({ path: this.defaultUrl });
    }

    const currentUrl = new URL(this.window.location.href);
    let newUrl = `${currentUrl.origin}${this.standardizeUrl(path, true)}`;

    if (preserveQuery) {
      newUrl += currentUrl.search;
    }

    // Prevent pushing to history if the path hasn't changed
    if (newUrl !== this.window.location.href) {
      this.window.history.pushState({}, "", newUrl);
    }

    this.loadScreenFromUrl(force);
  }

  back() {
    this.window.history.back();
  }

  // TODO: Make this and renderScreen methods return promises so that callers can await navigation before doing something else.
  loadScreenFromUrl(force = false) {
    const path = this.standardizeUrl(
      new URL(this.window.location.href).pathname
    );

    if (path !== "/" && !this.isUserLoggedIn()) {
      // Notify the user and redirect to root if not logged in
      this.notifyUserToLogIn();
      return this.navigate({ path: "/" });
    } else if (path === "/" && this.isUserLoggedIn()) {
      return this.navigate({ path: this.defaultUrl });
    }

    if (path !== this.currentPath || force) {
      this.currentPath = path;

      const match = this.matchPathToUrlEntry(path);

      if (match) {
        const queryParams = Object.fromEntries(
          new URL(this.window.location.href).searchParams.entries()
        );
        this.currentScreenView = this.renderScreen(match.view, {
          ...match.params,
          ...queryParams,
        });

        if (this.currentScreenView) {
          const { sectionId, screenId } = match;
          const sectionChanging = sectionId !== this.currentSectionId;

          if (sectionChanging) {
            this.currentSectionId = sectionId;
          }
          this.currentScreenId = screenId;

          const eventPayload: NavigateEventPayload = {
            screenConfig: this.getScreenById(
              this.currentSectionId,
              this.currentScreenId
            )!,
            ...(sectionChanging && {
              sectionConfig: this.screenMap[this.currentSectionId].config,
            }),
          };

          this.emit("navigate", eventPayload);
        }
      } else {
        // No matching screen found. Attempting to extract section ID from the URL...
        const pathSegments = this.currentPath.split("/").filter(Boolean); // Removes empty strings
        const potentialSectionId = pathSegments[0]; // e.g., 'data'
        const section = this.screenMap[potentialSectionId];

        if (section && section.config.defaultUrl) {
          return this.app.navigate(section.config.defaultUrl);
        } else {
          // No defaultUrl, proceed to display the 404 page
          const notFoundEntry = this.getScreenById("root", "not-found");

          if (notFoundEntry) {
            console.warn(`No matching route found for path: ${path}`);
            this.currentScreenView = this.renderScreen(notFoundEntry.view, {
              path,
            });
          } else {
            console.error("404 NotFoundView is missing from screenMap.");
            this.app.sectionElement.innerHTML = "<h1>404: Page Not Found</h1>";
          }
        }
      }
    }
  }

  // TODO: Use app.newInstance to render our views. Requires us to have a string indentifier for each view rather than the view class itself.
  renderScreen(view: typeof BaseView, options: object): BaseView | undefined {
    let instance: BaseView | undefined;

    const fail = (error?: Error) => {
      this.app.sectionElement.innerHTML =
        "<p>An error occurred while loading the screen.</p>";
      console.error(
        `Failed to render screen: ${this.currentSectionId}-${this.currentScreenId} at path: ${this.currentPath}`
      );
      if (error) {
        console.error(error);
      }
    };

    try {
      instance = new view(
        {
          ...options,
          attachTo: this.app.sectionElement,
        },
        this.app
      );
    } catch (error) {
      fail(error);
    }

    if (instance) {
      // this.app.tipController.closeAll();

      this.app.sectionElement.innerHTML = "";

      if (this.currentScreenView) {
        this.currentScreenView.destroy();
      }

      instance.render();
      instance.isReady.then(() => this.app.setLoadingState(false));
    } else {
      fail();
    }

    return instance;
  }

  getCurrentPath(): string {
    return this.currentPath;
  }

  getSectionConfigs(includeHidden = false): SectionConfig[] {
    const configs = Object.values(this.screenMap).map(
      (section) => section.config
    );
    return includeHidden ? configs : configs.filter((config) => !config.hidden);
  }

  getCurrentSectionConfig(): SectionConfig {
    return this.screenMap[this.currentSectionId].config;
  }

  getCurrentScreenConfig(): ScreenConfig {
    return this.getScreenById(this.currentSectionId, this.currentScreenId)!;
  }

  getCurrentScreenView(): BaseView | undefined {
    return this.currentScreenView;
  }

  getVisibleScreenConfigs(
    section: string = this.currentSectionId
  ): ScreenConfig[] {
    const sectionData = this.screenMap[section];
    if (!sectionData) return [];

    return sectionData.screens.filter((screen) => !screen.hidden);
  }

  getUrlForScreen({
    sectionId = this.currentSectionId,
    screenId,
    urlId,
  }: {
    sectionId?: string;
    screenId: string;
    urlId?: string;
  }): string | undefined {
    const entry = this.getScreenById(sectionId, screenId);

    if (entry) {
      let url = entry.url;

      if (url.includes("/:id")) {
        url = url.replace("/:id", urlId && urlId.length ? `/${urlId}` : "");
      }

      return url;
    }

    return undefined;
  }

  // Update query parameters in the address bar.
  setQueryParams(params: { [key: string]: string | null | undefined }) {
    const url = new URL(this.window.location.href);
    const searchParams = new URLSearchParams(url.search);

    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        searchParams.delete(key);
      } else if (value !== undefined) {
        searchParams.set(key, value);
      }
      // If value is undefined, leave it unchanged
    });

    url.search = searchParams.toString();
    this.window.history.replaceState({}, "", url.toString());
  }

  // Takes in a path with potential parameter values in the path and matches them to entries in the table
  // that use ":paramName" as placeholders for those values.
  private matchPathToUrlEntry(
    path: string
  ): (UrlMapEntry & { params: Record<string, string> }) | undefined {
    function getUrlSegments(url: string): string[] {
      return url.split("/").filter((segment) => segment.length > 0);
    }

    for (const [urlPattern, entry] of Object.entries(this.urlMap)) {
      const patternSegments = getUrlSegments(urlPattern);
      const pathSegments = getUrlSegments(path);

      if (patternSegments.length !== pathSegments.length) continue;

      const params: Record<string, string> = {};
      let isMatch = true;

      for (let i = 0; i < patternSegments.length; i++) {
        if (patternSegments[i].startsWith(":")) {
          const paramName = patternSegments[i].substring(1);
          params[paramName] = pathSegments[i];
        } else if (patternSegments[i] !== pathSegments[i]) {
          isMatch = false;
          break;
        }
      }

      if (isMatch) {
        return { ...entry, params };
      }
    }

    console.warn(`No matching route found for path: ${path}`);
    return undefined;
  }

  private getScreenById(
    sectionId: string,
    screenId: string
  ): ScreenConfig | undefined {
    return this.screenMap[sectionId]?.screens.find((s) => s.id === screenId);
  }

  private standardizeUrl(url: string, addBase = false): string {
    if (this.baseUrl) {
      if (addBase) {
        url = `${this.baseUrl}${url}`;
      } else if (url.startsWith(this.baseUrl)) {
        url = url.slice(this.baseUrl.length);
      }
    }

    if (!url || url === "/") {
      return "/";
    } else {
      // Ensure path always includes a leading and a trailing slash
      return `/${url.replace(/^\/|\/$/g, "")}/`;
    }
  }

  private notifyUserToLogIn() {
    // this.app.notificationController.load<TextNotification>("text", {
    //   id: "login-notification",
    //   message: "You need to login or create an account first!",
    // });
  }

  private isUserLoggedIn(): boolean {
    return this.app.user.isLoggedIn();
  }
}
