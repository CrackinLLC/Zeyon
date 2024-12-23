import { beforeEach, describe, expect, it, vi } from 'vitest';
import ClassRegistry from '../../src/classRegistry';
import Emitter from '../../src/emitter';
import type { ClassMapKey } from '../../src/generated/ClassMapType';
import type { AnyDefinition } from '../../src/imports/classRegistry';
import { ClassRegistryOptions } from '../../src/imports/classRegistry';
import { MockZeyonApp } from '../util/mockApp';

// 1) Create dummy classes that extend Emitter
//    simulating definitions with a static 'registrationId'
class DummyClassA extends Emitter {
  static registrationId = 'dummy-a';
}
class DummyClassB extends Emitter {
  static registrationId = 'dummy-b';
}
class DummyClassC extends Emitter {
  static registrationId = 'dummy-c';
}
class InvalidClass {
  /* Not extending Emitter */
}

// 2) Mock a small subset of classMapData that might appear in the generated file
//    We'll manually define it here for testing, but in real tests you might stub or mock imports.
const mockClassMapData: Record<string, AnyDefinition> = {
  'dummy-a': DummyClassA,
  'dummy-b': DummyClassB,
  'invalid-class': InvalidClass as any,
};

// 3) We'll override or mock the 'classMapData' import inside ClassRegistry if needed
//    Because in your actual code, ClassRegistry calls registerClasses(Object.values(classMapData)) in initialize().
//    But for simplicity, we can just test initialize with local stubs or rely on the same approach.

describe('ClassRegistry unit tests', () => {
  let registry: ClassRegistry;

  beforeEach(() => {
    const mockOptions: ClassRegistryOptions = {
      // We can add additional fields if needed
      // from EmitterOptions or anything else.
      events: [],
    };
    const mockApp = new MockZeyonApp(); // minimal app

    // Now we create a new registry:
    registry = new ClassRegistry(mockOptions, mockApp);
  });

  it('has the correct static registrationId', () => {
    expect(ClassRegistry.registrationId).toBe('zeyon-registry');
  });

  it('starts with an empty classMap', async () => {
    // isClassRegistered should return false for any ID
    expect(registry.isClassRegistered('dummy-a')).toBe(false);
    // getClass should return undefined
    const def = await registry.getClass('dummy-a' as ClassMapKey);
    expect(def).toBeUndefined();
  });

  it('registerClass adds a new definition and emits registered', async () => {
    // Spy on the registry's emitter
    const spyEmit = vi.spyOn(registry, 'emit');

    registry.registerClass(DummyClassA);
    expect(registry.isClassRegistered(DummyClassA.registrationId)).toBe(true);

    // Check that the correct event was emitted
    expect(spyEmit).toHaveBeenCalledWith('registered', { id: 'dummy-a' });

    // getClass should now return the definition
    const fetched = await registry.getClass('dummy-a' as ClassMapKey);
    expect(fetched).toBe(DummyClassA);
  });

  it('registerClass overwrites an existing definition and emits overwritten', () => {
    // First register
    registry.registerClass(DummyClassA);
    expect(registry.isClassRegistered('dummy-a')).toBe(true);

    const spyEmit = vi.spyOn(registry, 'emit');

    // Overwrite with a different class but the same ID
    // For the sake of testing, let's force DummyClassB to have the same ID as A
    const OverwritingClass: AnyDefinition = class OverwritingClass extends Emitter {
      static registrationId = 'dummy-a';
    };
    registry.registerClass(OverwritingClass);

    // Overwrite should happen
    expect(spyEmit).toHaveBeenCalledWith('overwritten', { id: 'dummy-a' });

    // Now getClass('dummy-a') should return OverwritingClass
  });

  it('registerClasses filters out invalid entries and registers valid ones', async () => {
    // Spy on the registerClass method to see which ones pass validation
    const spyRegisterClass = vi.spyOn(registry, 'registerClass');

    // We'll define a local array that simulates reading from mockClassMapData
    // But we pass them as (AnyDefinition | unknown) to replicate real usage
    const definitionsArray = [
      DummyClassB,
      DummyClassC,
      InvalidClass, // Not extending Emitter
      { random: 'object' }, // Not a function at all
    ];

    // @ts-ignore -- definitionsArray intentionally contains invalid entries for testing purposes
    registry.registerClasses(definitionsArray);

    // Only B & C should have been recognized as valid
    expect(spyRegisterClass).toHaveBeenCalledTimes(2);
    expect(registry.isClassRegistered('dummy-b')).toBe(true);
    expect(registry.isClassRegistered('dummy-c')).toBe(true);

    // invalid-class, random objects are ignored
    expect(registry.isClassRegistered('invalid-class')).toBe(false);
  });

  it('getClass returns undefined if not found', async () => {
    const entry = await registry.getClass('nonexistent' as ClassMapKey);
    expect(entry).toBeUndefined();
  });
});
