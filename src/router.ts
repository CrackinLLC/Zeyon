import type ApplicationCore from './app';
import Emitter from './emitter';
import type {
  NavigateEventPayload,
  RouterOptions,
  ScreenConfig,
  ScreenMap,
  UrlMap,
  UrlMapEntry,
} from './imports/router';
import type View from './view';

export default class Router extends Emitter {
  private currentSectionId: string | undefined;
  private currentScreenId: string | undefined;
  private currentScreenView: View | undefined;
  private currentPath: string = '';

  private window: Window;
  private screenMap: ScreenMap;
  private urlMap: UrlMap = {};
  private defaultUrl: string | undefined;
  private baseUrl: string | undefined;

  constructor({ screenMap, window, baseUrl, defaultUrl }: RouterOptions, private app: ApplicationCore) {
    super({
      customEvents: [
        'navigate', // New section or screen is loaded
        'query', // Query parameter is changed
      ],
    });

    this.screenMap = screenMap;
    this.window = window;
    this.currentPath = this.standardizeUrl(new URL(this.window.location.href).pathname);

    if (defaultUrl) {
      this.defaultUrl = defaultUrl;
    }

    if (baseUrl) {
      this.baseUrl = baseUrl;
    }

    // Build the UrlMap from the ScreenMap
    Object.entries(this.screenMap).forEach(([section, { screens }]) => {
      screens.forEach((screen) => {
        this.urlMap[this.standardizeUrl(screen.url)] = {
          viewBinaryId: screen.viewBinaryId,
          sectionId: section,
          screenId: screen.id,
        };
      });
    });
  }

  start(app: ApplicationCore) {
    this.app = app;
    this.window.addEventListener('popstate', () => this.loadScreenFromUrl());
    this.navigate({ preserveQuery: true, force: true }); // Load initial screen view

    this.app.user.on('logout', {
      handler: () => this.navigate({ path: '/', force: true }),
    });
  }

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
      canProceed = await this.currentScreenView.beforeNavigate(path);
    }
    if (!canProceed) return;

    const currentUrl = new URL(this.window.location.href);
    let newUrl = `${currentUrl.origin}${this.standardizeUrl(path, true)}`;

    if (preserveQuery) {
      newUrl += currentUrl.search;
    }

    // Prevent pushing to history if the path hasn't changed
    if (newUrl !== this.window.location.href) {
      this.window.history.pushState({}, '', newUrl);
    }

    this.loadScreenFromUrl(force);
  }

  back() {
    this.window.history.back();
  }

  loadScreenFromUrl(force = false) {
    const path = this.standardizeUrl(new URL(this.window.location.href).pathname);

    if (path !== this.currentPath || force) {
      this.currentPath = path;

      const match = this.matchPathToUrlEntry(path);

      if (match) {
        const queryParams = Object.fromEntries(new URL(this.window.location.href).searchParams.entries());
        this.currentScreenView = this.renderScreen(match.viewBinaryId, {
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
            screenConfig: this.getScreenById(this.currentSectionId, this.currentScreenId)!,
            ...(sectionChanging && {
              sectionConfig: this.screenMap[this.currentSectionId].config,
            }),
          };

          this.emit('navigate', eventPayload);
        }
      } else {
        // No matching screen found. Attempting to extract section ID from the URL...
        const pathSegments = this.currentPath.split('/').filter(Boolean);
        const potentialSectionId = pathSegments[0];
        const section = this.screenMap[potentialSectionId];

        if (section && section.config.defaultUrl) {
          return this.app.navigate(section.config.defaultUrl);
        } else {
          // No defaultUrl, proceed to display the 404 page
          const notFoundEntry = this.getScreenById('root', 'not-found');

          if (notFoundEntry) {
            console.warn(`No matching route found for path: ${path}`);
            this.currentScreenView = this.renderScreen(notFoundEntry.viewBinaryId, {
              path,
            });
          } else {
            console.error('404 NotFoundView is missing from screenMap.');
            this.app.sectionElement.innerHTML = '<h1>404: Page Not Found</h1>';
          }
        }
      }
    }
  }

  renderScreen(viewBinaryId: string, options: object): View | undefined {
    let instance: View | undefined;

    const fail = (error?: Error) => {
      this.app.sectionElement.innerHTML = '<p>An error occurred while loading the screen.</p>';
      console.error(
        `Failed to render screen: ${this.currentSectionId}-${this.currentScreenId} at path: ${this.currentPath}`,
      );
      if (error) {
        console.error(error);
      }
    };

    try {
      instance = this.app.newInstance<View>(viewBinaryId, {
        ...options,
        attachTo: this.app.sectionElement,
      });
    } catch (error) {
      fail(error);
    }

    if (instance) {
      this.app.sectionElement.innerHTML = '';

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

  // ... rest of the class remains unchanged, except for references to `view` replaced with `viewBinaryId`

  private matchPathToUrlEntry(path: string): (UrlMapEntry & { params: Record<string, string> }) | undefined {
    function getUrlSegments(url: string): string[] {
      return url.split('/').filter((segment) => segment.length > 0);
    }

    for (const [urlPattern, entry] of Object.entries(this.urlMap)) {
      const patternSegments = getUrlSegments(urlPattern);
      const pathSegments = getUrlSegments(path);

      if (patternSegments.length !== pathSegments.length) continue;

      const params: Record<string, string> = {};
      let isMatch = true;

      for (let i = 0; i < patternSegments.length; i++) {
        if (patternSegments[i].startsWith(':')) {
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

  private getScreenById(sectionId: string, screenId: string): ScreenConfig | undefined {
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

    if (!url || url === '/') {
      return '/';
    } else {
      // Ensure path always includes a leading and a trailing slash
      return `/${url.replace(/^\/|\/$/g, '')}/`;
    }
  }
}
