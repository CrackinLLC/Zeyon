import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZeyonAppOptions } from 'zeyon/imports';
import ZeyonApp from '../../dist/esm/app';
import ClassRegistry from '../../dist/esm/classRegistry';
import Router from '../../dist/esm/router';
import { getPrivate } from '../util/driver';
import { DummyClassView } from '../util/test_classMapData';

describe('ZeyonApp Unit Tests', () => {
  let el: HTMLElement;
  let options: ZeyonAppOptions;
  let app: ZeyonApp;
  let router: Router;
  let registry: ClassRegistry;

  beforeEach(() => {
    el = document.createElement('div');
    options = { el, name: 'TestApp', urlPrefix: '/test', routes: [] };

    app = new ZeyonApp(options);
    router = getPrivate(app, 'router');
    registry = getPrivate(app, 'registry');

    (router as any).loadRouteFromUrl = vi.fn(() => {});
    (registry as any).getClass = vi.fn(() => DummyClassView);
    (registry as any).getClassIds = vi.fn(() => new Set(['dummy-view', 'dummy-model', 'dummy-collection']));
  });

  it('initializes fields correctly', () => {
    expect(app.name).toBe('TestApp');
    expect(app.el).toBe(el);
    expect(app.isStarted).toBe(false);
    expect(router).toBeInstanceOf(Router);
    expect(registry).toBeInstanceOf(ClassRegistry);
    expect(app.window).toBe(window);
    expect(app.options).toBe(options);
  });

  it('resolves isReady on start', async () => {
    const readySpy = vi.fn();
    app.isReady.then(readySpy);
    expect(readySpy).not.toHaveBeenCalled();

    await app.start();
    expect(app.isStarted).toBe(true);
    expect(readySpy).toHaveBeenCalled();
  });

  it('does not start twice', async () => {
    await app.start();
    const spyRouterStart = vi.spyOn(router, 'start');
    await app.start();
    expect(spyRouterStart).not.toHaveBeenCalled();
  });

  it('navigate opens new tab if origin differs or openNewTab is true', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    app.navigate({ route: 'http://example.com' });
    expect(openSpy).toHaveBeenCalledWith('http://example.com/', '_blank');

    openSpy.mockClear();

    app.navigate({ route: '/local', newTab: true });
    expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('/local'), '_blank');
  });

  it('navigate calls router if same origin and openNewTab is false', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    app.navigate({ route: '/local' });

    expect(navigateSpy).toHaveBeenCalledWith({ route: '/local' });
  });

  it('newView calls newInstance and returns a promise', async () => {
    const newInstanceSpy = vi.spyOn(app as any, 'newInstance').mockImplementation(() => null);

    await app.newView('dummy-view' as any, {});
    expect(newInstanceSpy).toHaveBeenCalledWith('dummy-view', {});
  });

  it('start triggers router.start once', async () => {
    const spy = vi.spyOn(router, 'start');
    await app.start();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('toggleClass toggles classes on el', () => {
    app.toggleClass('test-class');
    expect(el.classList.contains('test-class')).toBe(true);
    app.toggleClass('test-class');
    expect(el.classList.contains('test-class')).toBe(false);
  });

  it('setLoadingState toggles loading element', () => {
    const templateSpy = vi.fn().mockReturnValue(document.createElement('div'));
    const originalTemplate = (global as any).loaderTemplate;
    (global as any).loaderTemplate = templateSpy;

    let res = app.setLoadingState();
    expect(res).toBe(true);
    res = app.setLoadingState();
    expect(res).toBe(false);

    (global as any).loaderTemplate = originalTemplate;
  });

  it('renderNewView calls newView for found elements', () => {
    const div = document.createElement('div');
    div.id = 'found';
    document.body.appendChild(div);

    const newViewSpy = vi.spyOn(app, 'newView');
    app.renderNewView('dummy-view', { attachTo: '#found' });
    expect(newViewSpy).toHaveBeenCalledWith('dummy-view', expect.any(Object));

    div.remove();
  });
});
