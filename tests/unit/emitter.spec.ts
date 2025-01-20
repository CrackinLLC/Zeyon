// tests/unit/emitter.spec.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Emitter from '../../src/emitter';
import type { EmitterOptions } from '../../src/imports/emitter';
import { MockZeyonApp } from '../util/mockApp';

class TestEmitter extends Emitter {
  constructor(options: EmitterOptions = {}, app: MockZeyonApp) {
    super(options, app);
  }
  public ready() {
    this.markAsReady();
  }
}

describe('Emitter', () => {
  let app: MockZeyonApp;
  let emitter: TestEmitter;

  beforeEach(() => {
    app = new MockZeyonApp();
    emitter = new TestEmitter({}, app);
  });

  afterEach(() => {
    emitter.destroy();
  });

  it('initializes with isReady promise and can mark as ready', async () => {
    const isReadySpy = vi.fn();
    emitter.isReady.then(isReadySpy);

    // Not resolved yet
    await Promise.resolve();
    expect(isReadySpy).not.toHaveBeenCalled();

    // Mark as ready
    emitter.ready();
    await emitter.isReady;
    expect(isReadySpy).toHaveBeenCalled();
  });

  it('allows adding valid events and listening to them (custom event)', () => {
    emitter.extendValidEvents('customEvent');
    const handler = vi.fn();

    emitter.on('customEvent', handler);
    emitter.emit('customEvent', { some: 'data' });

    // In new design:
    // handler is "NormalEventHandler": (data: any, ev?: CustomEvent)
    // So calls[0] => [ {some:'data'}, CustomEvent ]
    expect(handler).toHaveBeenCalledTimes(1);

    const [dataArg, eventArg] = handler.mock.calls[0];
    expect(dataArg).toEqual({ some: 'data' });
    expect(eventArg).toBeInstanceOf(CustomEvent);
    expect(eventArg.detail).toEqual({ some: 'data' });
  });

  it('warns on invalid events', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    emitter.emit('invalidEvent', { test: true });
    expect(consoleErrorSpy).toHaveBeenCalledWith('The event "invalidEvent" is not supported on this class.', emitter);
    consoleErrorSpy.mockRestore();
  });

  it('can register and unregister events', () => {
    emitter.extendValidEvents('testEvent');
    const handler = vi.fn();

    emitter.on('testEvent', handler);
    emitter.emit('testEvent', 123);
    expect(handler).toHaveBeenCalledTimes(1);

    const [dataArg] = handler.mock.calls[0];
    expect(dataArg).toBe(123);

    // Now remove
    emitter.off({ event: 'testEvent', handler });
    emitter.emit('testEvent', 456);
    expect(handler).toHaveBeenCalledTimes(1); // still 1
  });

  it('supports once() for single invocation', () => {
    emitter.extendValidEvents('oneTime');
    const handler = vi.fn();

    emitter.once('oneTime', handler);
    emitter.emit('oneTime', { val: 1 });
    emitter.emit('oneTime', { val: 2 });
    expect(handler).toHaveBeenCalledTimes(1);

    // With new design, calls[0] => [ {val:1}, CustomEvent ]
    const [dataArg, eventArg] = handler.mock.calls[0];
    expect(dataArg).toEqual({ val: 1 });
    expect(eventArg).toBeInstanceOf(CustomEvent);
  });

  it('supports the "*" wildcard event', () => {
    emitter.extendValidEvents(['testEvent', '*']);
    const starHandler = vi.fn();
    emitter.on('*', starHandler);

    emitter.emit('testEvent', { x: 10 });
    expect(starHandler).toHaveBeenCalledTimes(1);

    // New design: wildcard handler => (eventName, data, customEvent?)
    // So calls[0] => [ 'testEvent', { x:10 }, CustomEvent ]
    const [eventNameArg, dataArg, eventObj] = starHandler.mock.calls[0];
    expect(eventNameArg).toBe('testEvent');
    expect(dataArg).toEqual({ x: 10 });
    expect(eventObj).toBeInstanceOf(CustomEvent);
  });

  it('debouncedEmit aggregates payload if requested', async () => {
    emitter.extendValidEvents('debouncedEvent');
    const handler = vi.fn();

    emitter.on('debouncedEvent', handler);
    emitter['debouncedEmitterDelay'] = 10;

    emitter.debouncedEmit('debouncedEvent', { val: 1 });
    emitter.debouncedEmit('debouncedEvent', { val: 2 });
    await new Promise((r) => setTimeout(r, 50));

    // Should have been called once with aggregated array
    expect(handler).toHaveBeenCalledTimes(1);

    // calls[0] => [ [ {val:1}, {val:2} ], CustomEvent ]
    const [dataArg, eventArg] = handler.mock.calls[0];
    expect(dataArg).toEqual([{ val: 1 }, { val: 2 }]);
    expect(eventArg).toBeInstanceOf(CustomEvent);
    expect(eventArg.detail).toEqual([{ val: 1 }, { val: 2 }]);
  });

  it('destroy sets isDestroyed and emits destroyed event', () => {
    const destroySpy = vi.fn();
    emitter.on('destroyed', destroySpy);

    expect(emitter['isDestroyed']).toBe(false);
    emitter.destroy();
    expect(emitter['isDestroyed']).toBe(true);

    // "destroyed" event is emitted => calls => [ [undefined, CustomEvent] ] typically
    expect(destroySpy).toHaveBeenCalledTimes(1);
  });

  it('calls onDestroy on destroy', () => {
    const onDestroySpy = vi.spyOn(emitter as any, 'onDestroy');
    emitter.destroy();
    expect(onDestroySpy).toHaveBeenCalledTimes(1);
  });
});
