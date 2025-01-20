import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModelOptions } from '../../src/imports/model';
import Model from '../../src/model';
import { getPrivate } from '../util/driver';
import { MockZeyonApp } from '../util/mockApp';

// Example sub-class for testing:
class TestModel extends Model {
  // We'll provide a typed "attrib" if we want type-checking:
  declare attrib: {
    id?: number;
    name?: string;
  };

  // Optionally define a custom static definition:
  static definition = {
    id: { type: 'number', optional: true },
    name: { type: 'string', optional: true },
  } as const;
}

describe('Model', () => {
  let app: MockZeyonApp;
  let options: ModelOptions<{ id?: number; name?: string }>;
  let model: TestModel;

  beforeEach(() => {
    app = new MockZeyonApp();

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
    expect(changeSpy.mock.calls[0][0]).toEqual({ name: 'Bob' });
    expect(nameChangeSpy).toHaveBeenCalledTimes(1);
    expect(nameChangeSpy.mock.calls[0][0]).toEqual({
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

  it('destroy removes from parent collection and cleans up', () => {
    // Mock a parent collection
    const mockCollection = {
      remove: vi.fn(),
      off: vi.fn(),
    } as any;

    model.setCollection(mockCollection);
    const destroySpy = vi.spyOn(model, 'destroy');

    model.destroy();
    expect(destroySpy).toHaveBeenCalled();
    expect(mockCollection.remove).toHaveBeenCalledWith(model.getId());
    expect(mockCollection.off).toHaveBeenCalledWith({ subscriber: model });

    // The isDestroyed flag from Emitter
    const isDestroyed = getPrivate(model, 'isDestroyed');
    expect(isDestroyed).toBe(true);
  });

  it('select marks the model as selected', () => {
    const selectedSpy = vi.fn();
    model.on('selected', selectedSpy);

    model.select(true);
    expect(selectedSpy.mock.calls[0][0]).toBe(true);
    expect(selectedSpy.mock.calls[0][1]).toBeInstanceOf(CustomEvent);
    expect(model.isSelected()).toBe(true);

    model.select(false);
    expect(model.isSelected()).toBe(false);
  });
});
