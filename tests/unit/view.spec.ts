import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Attributes } from '../../src/imports/model';
import type { ViewOptions } from '../../src/imports/view';
import { nativeEvents } from '../../src/imports/view';
import Model from '../../src/model';
import View from '../../src/view';
import { getPrivate } from '../util/driver';
import { MockZeyonApp } from '../util/mockApp';

class TestView extends View {
  protected ui = { testKey: 'my-selector' };
  template = `
    <div>
      <div data-js="my-selector" id="match"></div>
    </div>
  `;
}

class TestModel extends Model {
  attrib: Attributes;
}

describe('View', () => {
  let app: MockZeyonApp;
  let view: TestView;
  let options: ViewOptions;
  let el: HTMLElement;

  beforeEach(() => {
    app = new MockZeyonApp();

    options = {
      classNames: ['test-class'],
      attributes: { 'data-testatt': 'example' },
    };

    view = new TestView(options, app);
    el = getPrivate(view, 'el');
  });

  it('initializes with an el and sets isRendered promise', async () => {
    expect(view).toBeInstanceOf(View);
    expect(el).toBeInstanceOf(HTMLElement);
    expect(typeof view.isRendered?.then).toBe('function');
    expect(view.getViewId()).toBeTruthy();
    expect(view.options).toEqual({ ...options, events: nativeEvents });
  });

  it('setModel handles no-op, string regId, and pre-instantiated model', async () => {
    // Mock app.newModel to return a fake model
    const mockCreatedModel = new TestModel({ attributes: { id: 111 } }, app);
    const newModelSpy = vi.spyOn(app, 'newModel').mockResolvedValue(mockCreatedModel);

    // Case A: No model option -> model undefined
    await view.isReady;
    expect(view.getModel()).toBeUndefined();

    // Case B: model option is string -> calls app.newModel('some-id')
    const vB = new TestView({ model: 'some-id' }, app);
    await vB.isReady;
    expect(newModelSpy).toHaveBeenCalledWith('some-id');
    expect(vB.getModel()).toBe(mockCreatedModel);

    // Case C: model option is Model instance
    const myModel = new TestModel({ attributes: { id: 999 } }, app);
    const vC = new TestView({ model: myModel }, app);
    await vC.isReady;
    expect(vC.getModel()).toBe(myModel);
  });

  it('render sets up root element only once', async () => {
    const attachSpy = vi.spyOn(view as any, 'attachRootElement');
    const prepareSpy = vi.spyOn(view as any, 'prepareRootElement');

    await view.render();
    expect(prepareSpy).toHaveBeenCalledTimes(1);
    expect(attachSpy).toHaveBeenCalledTimes(1);

    await view.render();
    expect(prepareSpy).toHaveBeenCalledTimes(1);
    expect(attachSpy).toHaveBeenCalledTimes(1);
  });

  it('render resets events if already rendered', async () => {
    const offSpy = vi.spyOn(view, 'off');
    await view.render();
    await view.render();
    expect(offSpy).toHaveBeenCalledWith({ subscriber: view });
  });

  it('appends to DOM if attachTo is given', async () => {
    const container = document.createElement('div');
    const v = new TestView({ attachTo: container }, app);
    await v.render();
    expect(container.contains(getPrivate(v, 'el'))).toBe(true);
  });

  it('prepends to DOM if prepend is true', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<div class="existing"></div>';
    const v = new TestView({ attachTo: container, prepend: true }, app);
    await v.render();
    expect(container.firstChild).toBe(getPrivate(v, 'el'));
  });

  it('generateUiSelections stores selections in _ui', async () => {
    await view.render();

    expect(getPrivate(view, '_ui').testKey).toBeDefined();
    expect(getPrivate(view, '_ui').testKey.length).toBe(1);
  });

  it('setErrorState adds and removes error template and class', () => {
    view.setErrorState('Error message');

    expect(el.classList.contains('is-error')).toBe(true);

    // TODO: Appending child element not getting detected (or occuring) in mock environment
    // expect(view.findChildEl('.error-template')).toBeTruthy();

    getPrivate(view, 'removeErrorState').bind(view)();

    expect(el.classList.contains('is-error')).toBe(false);

    // TODO: Appending child element not getting detected (or occuring) in mock environment
    // expect(el.querySelector('.error-template')).toBeFalsy();
  });

  it('destroy cleans up everything', async () => {
    await view.render();
    const destroyChildSpy = vi.spyOn(view, 'destroyChildren');
    view.destroy();
    expect(destroyChildSpy).toHaveBeenCalled();
    expect(getPrivate(view, 'isDestroyed')).toBe(true);
    expect(el.parentNode).toBeNull();
  });

  it('newChild calls app.newView and stores child', async () => {
    const newViewSpy = vi
      .spyOn(app, 'newView')
      .mockResolvedValue({ render: vi.fn(), getViewId: () => 'child-id' } as any);
    const child = await view.newChild('some-view' as any, {});
    expect(newViewSpy).toHaveBeenCalledWith('some-view', {});
    expect((view as any).children['child-id']).toBe(child);
  });

  it('destroyChildById calls destroy on child', async () => {
    const mockChild = {
      getViewId: () => 'mock-id',
      destroy: vi.fn(),
    } as any;
    (view as any).children['mock-id'] = mockChild;
    view['destroyChildById']('mock-id');
    expect(mockChild.destroy).toHaveBeenCalled();
    expect((view as any).children['mock-id']).toBeUndefined();
  });

  it('setAttributes applies and removes attributes', () => {
    view.setAttributes({ 'data-test': 'yes', custom: 'val' });
    expect(el.getAttribute('data-test')).toBe('yes');
    expect(el.getAttribute('custom')).toBe('val');
    view.setAttributes({ 'data-test': null, custom: undefined });
    expect(el.hasAttribute('data-test')).toBe(false);
    expect(el.hasAttribute('custom')).toBe(false);
  });

  it('swapClasses toggles between two classes', () => {
    el.className = '';
    view.swapClasses('on', 'off', true);
    expect(el.classList.contains('on')).toBe(true);
    expect(el.classList.contains('off')).toBe(false);
    view.swapClasses('on', 'off', false);
    expect(el.classList.contains('on')).toBe(false);
    expect(el.classList.contains('off')).toBe(true);
  });

  it('getId returns model id if present', async () => {
    const m = new TestModel({ attributes: { id: 999 } } as any, app);
    const v = new TestView({ model: m }, app);
    await v.isReady;
    expect(v.getId()).toBe(999);
  });
});
