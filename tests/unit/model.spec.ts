import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ModelOptions } from 'zeyon/imports';
import Model from '../../dist/esm/model';
import { getPrivate } from '../util/driver';
import { TestZeyonApp } from '../util/testApp';
import { TestCollection } from '../util/testCollection';
import { TestModel } from '../util/testModel';

describe('Model', () => {
  let app: TestZeyonApp;
  let options: ModelOptions<{ id?: number; name?: string }>;
  let model: TestModel;

  beforeEach(() => {
    app = new TestZeyonApp();

    options = {
      // Example attributes
      attributes: { id: 101, name: 'Alice' },
      events: [], // or any custom event array
    };

    model = new TestModel(options, app);
  });

  it('instantiates properly and sets initial attributes', () => {
    expect(model).toBeInstanceOf(Model);

    // Check the "attributes" store
    expect(model.get('id')).toBe(101);
    expect(model.get('name')).toBe('Alice');

    // Check original snapshot
    const attrsOrig = getPrivate(model, 'attributesOriginal');
    expect(attrsOrig).toEqual({ id: 101, name: 'Alice' });
    expect(model.hasChanges()).toBe(false);
  });

  it('handles partial set and emits events', () => {
    const changeSpy = vi.fn();
    const nameChangeSpy = vi.fn();
    model.on('change', changeSpy);
    model.on('name:change', nameChangeSpy);

    model.set({ name: 'Bob' });
    expect(model.get('name')).toBe('Bob');

    // "attributesOriginal" is still { id: 101, name: 'Alice' }
    expect(model.hasChanges()).toBe(true);

    // Event assertions
    expect(changeSpy).toHaveBeenCalledTimes(1);
    expect(changeSpy.mock.calls[0][0].data).toEqual({ name: 'Bob' });
    expect(nameChangeSpy).toHaveBeenCalledTimes(1);
    expect(nameChangeSpy.mock.calls[0][0].data).toEqual({
      value: 'Bob',
      previous: 'Alice',
    });
  });

  it('unsets an attribute and emits correct events', () => {
    const unsetSpy = vi.fn();
    model.on('name:unset', unsetSpy);

    model.unset('name');
    expect(model.get('name')).toBeUndefined();
    expect(unsetSpy).toHaveBeenCalled();
    expect(model.hasChanges()).toBe(true);
  });

  it('resets to original attributes', () => {
    model.set({ name: 'Changed' });
    expect(model.hasChanges()).toBe(true);

    // Listen to 'reset' event
    const resetSpy = vi.fn();
    model.on('reset', resetSpy);

    model.reset();
    // Should revert to { id: 101, name: 'Alice' }
    expect(model.get('name')).toBe('Alice');
    expect(model.hasChanges()).toBe(false);
    expect(resetSpy).toHaveBeenCalledTimes(1);
  });

  it('coerces attributes according to static definition', () => {
    // If "id" is "string", we expect to coerce to number
    model.set({ id: '999' } as any);
    expect(model.get('id')).toBe(999); // coerced from string to number
  });

  it('destroy removes model listeners from parent collection', () => {
    const mockCollection = new TestCollection({}, app) as any;
    model.setCollection(mockCollection);

    const offSpy = vi.spyOn(mockCollection, 'off');
    const destroySpy = vi.spyOn(model, 'destroy');

    model.destroy();

    expect(offSpy).toHaveBeenCalledWith({ subscriber: model });
    expect(destroySpy).toHaveBeenCalled();
    expect(getPrivate(model, 'isDestroyed')).toBe(true);
  });

  it('select marks the model as selected', () => {
    const selectedSpy = vi.fn();
    model.on('selected', selectedSpy);

    model.select(true);

    expect(selectedSpy.mock.calls[0][0].data).toBe(true);
    expect(selectedSpy.mock.calls[0][0].ev).toBeInstanceOf(CustomEvent);
    expect(model.isSelected()).toBe(true);

    model.select(false);
    expect(model.isSelected()).toBe(false);
  });
});
