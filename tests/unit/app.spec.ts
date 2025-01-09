import { beforeEach, describe, expect, it, vi } from 'vitest';
import ZeyonApp from '../../src/app';
import ClassRegistry from '../../src/classRegistry';
import Emitter from '../../src/emitter';
import type { ZeyonAppOptions } from '../../src/imports/app';
import Router from '../../src/router';
import { getPrivate } from '../util/driver';

class DummyClass extends Emitter {
  static registrationId = 'dummy-a';
}

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
    (registry as any).getClass = vi.fn(() => DummyClass);
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

    app.navigate('http://example.com');
    expect(openSpy).toHaveBeenCalledWith('http://example.com/', '_blank');

    openSpy.mockClear();

    app.navigate('/local', true);
    expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('/local'), '_blank');
  });

  it('navigate calls router if same origin and openNewTab is false', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    app.navigate('/local');

    expect(navigateSpy).toHaveBeenCalledWith({ path: '/local' });
  });

  it('newView calls newInstance and returns a promise', async () => {
    const newInstanceSpy = vi.spyOn(app as any, 'newInstance').mockImplementation(() => null);

    await app.newView('fake-id' as any, {});
    expect(newInstanceSpy).toHaveBeenCalledWith('fake-id', {});
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

  it('renderGlobalView logs a warning if element not found', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    app.renderGlobalView({ selector: '#notfound', registrationId: 'some-id' as any });
    expect(warnSpy).toHaveBeenCalledWith('Element not found for selector: #notfound');
    warnSpy.mockRestore();
  });

  it('renderGlobalView calls newView for found elements', () => {
    const div = document.createElement('div');
    div.id = 'found';
    document.body.appendChild(div);

    const newViewSpy = vi.spyOn(app, 'newView');
    app.renderGlobalView({ selector: '#found', registrationId: 'some-id' as any });
    expect(newViewSpy).toHaveBeenCalledWith('some-id', expect.any(Object));

    div.remove();
  });
});
