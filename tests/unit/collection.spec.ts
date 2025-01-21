import '../util/testClassMapType';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import Collection from '../../src/collection';
import type Model from '../../src/model';
import { milliseconds } from '../util/driver';
import { TestZeyonApp } from '../util/testApp';
import { TestCollection } from '../util/testCollection';
import { TestModel } from '../util/testModel';

describe('Collection', () => {
  let app: TestZeyonApp;
  let collection: TestCollection;

  function newModel(attributes: any): Model {
    return new TestModel({ attributes }, app);
  }

  beforeEach(() => {
    app = new TestZeyonApp();
    // Mock the app.newModel call:
    vi.spyOn(app, 'newModel').mockImplementation(async (regId, opts) => {
      return newModel(opts?.attributes);
    });

    collection = new TestCollection({}, app);
    collection.modelConstructor = TestModel;
  });

  it('initializes and can mark as ready', async () => {
    await collection.isReady;
    expect(collection).toBeInstanceOf(Collection);
  });

  it.only('newModel() creates models in parallel and emits "update" unless silent', async () => {
    const updateSpy = vi.fn();
    collection.on('update', updateSpy);

    await collection.newModel([{ id: 1 }, { id: 2 }]);
    expect(collection.getItems().length).toBe(2);

    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy.mock.calls[0][0]).toMatchObject({ action: 'new' });

    updateSpy.mockClear();
    await collection.newModel({ id: 3 }, true);
    expect(collection.getItems().length).toBe(3);
    expect(updateSpy).not.toHaveBeenCalled(); // silent => no update
  });

  it('add() attaches bridging and emits update event with correct payload', () => {
    const updateSpy = vi.fn();
    collection.on('update', updateSpy);

    const m = newModel({ id: 999 });
    vi.spyOn(m, 'getRegistrationId').mockReturnValue('test-model');

    collection.add(m);
    expect(updateSpy).toHaveBeenCalledTimes(1);

    const [payloadArg, eventArg] = updateSpy.mock.calls[0];
    expect(payloadArg).toEqual({ action: 'add', models: [m] });
    expect(eventArg).toBeInstanceOf(CustomEvent);
  });

  it('remove() removes by ID and emits update event', () => {
    const m = newModel({ id: 10 });
    vi.spyOn(m, 'getRegistrationId').mockReturnValue('test-model');
    collection.add(m);

    const updateSpy = vi.fn();
    collection.on('update', updateSpy);

    expect(collection.getItems()).toHaveLength(1);
    const removed = collection.remove(10);
    expect(removed).toHaveLength(1);
    expect(collection.getItems()).toHaveLength(0);

    const [payloadArg, eventArg] = updateSpy.mock.calls[0];
    expect(payloadArg).toEqual({ action: 'remove', models: removed });
    expect(eventArg).toBeInstanceOf(CustomEvent);
  });

  it('sort() sorts items, re-applies filters, and emits "sort"', () => {
    const sortSpy = vi.fn();
    collection.on('sort', sortSpy);

    collection.add([newModel({ id: 5 }), newModel({ id: 3 }), newModel({ id: 9 })]);

    // Sort ascending by id
    collection.sort((a, b) => a.getId()! - b.getId()!);
    expect(collection.getItems().map((m) => m.getId())).toEqual([3, 5, 9]);
    expect(sortSpy).toHaveBeenCalledTimes(1);
  });

  it('filters items, updates visibleItems, and emits "filter"', async () => {
    const filterSpy = vi.fn();
    collection.on('filter', filterSpy);

    collection.add([newModel({ id: 1 }), newModel({ id: 2 }), newModel({ id: 3 })]);
    collection.filter({ text: '2' });
    await milliseconds(15);

    expect(filterSpy).toHaveBeenCalledTimes(1);
    expect(collection.getVisibleItems().length).toEqual(1);
  });

  it('empty() destroys all models, clears items, and emits "update"', () => {
    const updateSpy = vi.fn();
    collection.add([newModel({ id: 101 }), newModel({ id: 102 })]);
    collection.on('update', updateSpy);

    expect(collection.getItems().length).toBe(2);
    collection.empty();
    expect(collection.getItems().length).toBe(0);

    const [payloadArg, eventArg] = updateSpy.mock.calls[0];
    expect(payloadArg).toEqual({ action: 'empty' });
    expect(eventArg).toBeInstanceOf(CustomEvent);
  });

  it('destroy() destroys collection, item destroy calls are triggered', () => {
    const m = newModel({ id: 500 });
    const destroySpy = vi.spyOn(m, 'destroy');

    collection.add(m);

    const colDestroySpy = vi.fn();
    collection.on('destroyed', colDestroySpy);

    collection.destroy();
    expect(collection['isDestroyed']).toBe(true);
    expect(destroySpy).toHaveBeenCalledTimes(1); // each item destroyed
    expect(colDestroySpy).toHaveBeenCalledTimes(1);
  });
});
