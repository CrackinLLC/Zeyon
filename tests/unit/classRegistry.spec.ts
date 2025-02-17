import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnyDefinition, ClassMapKey, ClassRegistryOptions } from 'zeyon/imports';
import { DummyClassCollection, DummyClassModel, DummyClassView, InvalidClass } from '../util/test_classMapData';
import '../util/test_ZeyonTypes';

import ClassRegistry from '../../dist/esm/classRegistry';
import Emitter from '../../dist/esm/emitter';
import { TestZeyonApp } from '../util/testApp';

describe('ClassRegistry', () => {
  let registry: ClassRegistry;

  beforeEach(() => {
    // test3
    const mockOptions: ClassRegistryOptions = { events: [] };
    const mockApp = new TestZeyonApp();
    registry = new ClassRegistry(mockOptions, mockApp);
  });

  it('has the expected registrationId', () => {
    expect(ClassRegistry.registrationId).toBe('zeyon-registry');
  });

  it('registerClass adds a definition and emits registered', async () => {
    const spyEmit = vi.spyOn(registry, 'emit');
    registry.registerClass(DummyClassView);
    expect(registry.hasClass('dummy-view')).toBe(true);
    expect(spyEmit).toHaveBeenCalledWith('registered', { id: 'dummy-view' });
    const fetched = await registry.getClass('dummy-view' as ClassMapKey);
    expect(fetched).toBe(DummyClassView);
  });

  it('overwrites existing definition and emits overwritten', () => {
    registry.registerClass(DummyClassView);
    expect(registry.hasClass('dummy-view')).toBe(true);
    const spyEmit = vi.spyOn(registry, 'emit');
    class OverwritingClass extends Emitter {
      static registrationId = 'dummy-view';
    }
    registry.registerClass(OverwritingClass);
    expect(spyEmit).toHaveBeenCalledWith('registered', { id: 'dummy-view' });
  });

  it('registerClasses skips invalid entries', async () => {
    const spyRegisterClass = vi.spyOn(registry, 'registerClass');
    const definitionsArray = [DummyClassModel, DummyClassCollection, InvalidClass, { random: 'object' }];

    definitionsArray.forEach((def) => registry.registerClass(def as AnyDefinition));
    expect(spyRegisterClass).toHaveBeenCalledTimes(4);
    expect(registry.hasClass('dummy-model')).toBe(true);
    expect(registry.hasClass('dummy-collection')).toBe(true);
    expect(registry.hasClass('invalid-class')).toBe(false);
  });

  it('getClass returns undefined if not found', async () => {
    const entry = await registry.getClass('nonexistent' as ClassMapKey);
    expect(entry).toBeUndefined();
  });
});
