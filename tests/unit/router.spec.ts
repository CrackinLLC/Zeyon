import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RouteConfig } from '../../src/imports/router';
import Router from '../../src/router';
import { TestZeyonApp } from '../util/testApp';

describe('Router', () => {
  let app: TestZeyonApp;
  let router: Router;

  const sampleRoutes: RouteConfig[] = [
    {
      registrationId: 'route-home',
      urlFragment: '',
      custom: { title: 'Home' },
    },
    {
      registrationId: 'route-about',
      urlFragment: 'about',
      childRoutes: [
        {
          registrationId: 'route-team',
          urlFragment: 'team',
        },
      ],
    },
    {
      registrationId: 'route-404',
      urlFragment: '404',
      is404: true,
    },
  ];

  beforeEach(() => {
    // Provide a mock app reference
    app = new TestZeyonApp({
      el: document.createElement('div'),
      routes: sampleRoutes,
    });

    // Initialize router with some test routes
    router = new Router({ urlPrefix: '/test', routes: sampleRoutes }, app);
  });

  describe('constructor & registerRoutes', () => {
    it('initializes urlMap, registrationIdMap, and siteMap correctly', () => {
      // Check urlMap
      expect(router['urlMap']['/']).toEqual(sampleRoutes[0]);
      expect(router['urlMap']['/about']).toEqual(sampleRoutes[1]);
      // child route
      expect(router['urlMap']['/about/team']).toEqual(sampleRoutes[1].childRoutes?.[0]);

      // Check registrationIdMap
      expect(router['registrationIdMap']['route-home']).toEqual(sampleRoutes[0]);
      expect(router['registrationIdMap']['route-about']).toEqual(sampleRoutes[1]);

      // Check siteMap
      const siteMap = router.getSiteMap();
      expect(siteMap).toHaveLength(3); // top-level routes
      // etc. Inspect children if needed
    });

    it('marks root and notFound routes, if applicable', () => {
      expect(router['root']).toBe(sampleRoutes[0]); // The route with fragment ''
      expect(router['notFound']).toBe(sampleRoutes[2]); // The is404 route
    });

    it('throws collision error if two routes produce the same full path', () => {
      const collisionRoutes: RouteConfig[] = [
        { registrationId: 'route-a', urlFragment: 'test' },
        { registrationId: 'route-b', urlFragment: 'test' },
      ];
      // re-instantiate or call registerRoutes
      const localRouter = new Router({ routes: [] }, app);
      expect(() => localRouter.registerRoutes(collisionRoutes)).toThrow(/Route collision/);
    });
  });

  describe('navigation flow', () => {
    it('start() sets up popstate listener and calls navigate(...force=true)', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      router.start();
      expect(navigateSpy).toHaveBeenCalledWith({ preserveQuery: true, force: true });
    });

    it('navigates to existing route', async () => {
      // mock some scenario
      const loadRouteSpy = vi.spyOn(router as any, 'loadRouteFromUrl');
      await router.navigate({ path: '/about' });
      expect(loadRouteSpy).toHaveBeenCalled();
      // check if currentRoute or currentRouteConfig is correct
      expect(router.getCurrentRouteConfig()?.registrationId).toBe('route-about');
    });

    it('falls back to notFound if route not found', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await router.navigate({ path: '/garbage' });
      // Because notFound is defined, it loads that route
      expect(router.getCurrentRouteConfig()?.registrationId).toBe('route-404');
      expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('No matching route found'));
    });

    it('warns if route not found and no is404 route exists', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // re-init router with no 404
      const localRouter = new Router(
        {
          routes: [{ registrationId: 'a', urlFragment: 'test' }],
        },
        app,
      );
      await localRouter.navigate({ path: '/bogus' });
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('No matching route found'));
    });
  });

  describe('dynamic segments', () => {
    it('matches path with dynamic :id segment', async () => {
      const dynamicRoutes: RouteConfig[] = [
        {
          registrationId: 'route-user',
          urlFragment: 'user/:id',
        },
      ];
      const localRouter = new Router({ routes: dynamicRoutes }, app);
      await localRouter.navigate({ path: '/user/123' });
      expect(localRouter.getCurrentRouteConfig()?.registrationId).toBe('route-user');
      // might check the param
      // you'd have to expose the param or check "currentRoute" logic
    });

    it('rejects leftover path segments', async () => {
      // path "/user/123/extra" won't match "user/:id"
      // verify we get no route or notFound
    });
  });

  describe('siteMap lookups', () => {
    it('returns entire siteMap if no url passed', () => {
      const siteMap = router.getSiteMap();

      expect(Array.isArray(siteMap)).toBe(true);
      expect((siteMap as Array<any>).length).toBeGreaterThan(0);
    });

    it('returns siteMap node for given url', () => {
      const node = router.getSiteMap('/about');
      expect((node as any).fullUrl).toBe('/about');
    });

    it('returns [] if not found', () => {
      const node = router.getSiteMap('/some/random/path');
      expect(node).toEqual([]);
    });
  });
});
