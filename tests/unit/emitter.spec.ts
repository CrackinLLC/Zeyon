import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestZeyonApp } from '../util/testApp';
import { TestEmitter } from '../util/testEmitter';

describe('Emitter', () => {
  let app: TestZeyonApp;
  let emitter: TestEmitter;

  beforeEach(() => {
    app = new TestZeyonApp();
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

    expect(handler).toHaveBeenCalledTimes(1);

    const spy = handler.mock.calls[0][0];
    expect(spy.data).toEqual({ some: 'data' });
    expect(spy.ev).toBeInstanceOf(CustomEvent);
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

    const spy = handler.mock.calls[0][0];
    expect(spy.data).toBe(123);

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
    const spy = handler.mock.calls[0][0];
    expect(spy.data).toEqual({ val: 1 });
    expect(spy.ev).toBeInstanceOf(CustomEvent);
  });

  it('supports the "*" wildcard event', () => {
    emitter.extendValidEvents(['testEvent', '*']);
    const starHandler = vi.fn();
    emitter.on('*', starHandler);

    emitter.emit('testEvent', { x: 10 });
    expect(starHandler).toHaveBeenCalledTimes(1);

    const spy = starHandler.mock.calls[0][0];
    expect(spy.eventName).toBe('testEvent');
    expect(spy.data).toEqual({ x: 10 });
    expect(spy.ev).toBeInstanceOf(CustomEvent);
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

    const spy = handler.mock.calls[0][0];
    expect(spy.data).toEqual([{ val: 1 }, { val: 2 }]);
    expect(spy.ev).toBeInstanceOf(CustomEvent);
  });

  it('destroy sets isDestroyed and emits destroyed event', () => {
    const destroySpy = vi.fn();
    emitter.on('destroyed', destroySpy);

    expect(emitter['isDestroyed']).toBe(false);
    emitter.destroy();
    expect(emitter['isDestroyed']).toBe(true);

    expect(destroySpy).toHaveBeenCalledTimes(1);
  });

  it('calls onDestroy on destroy', () => {
    const onDestroySpy = vi.spyOn(emitter as any, 'onDestroy');
    emitter.destroy();
    expect(onDestroySpy).toHaveBeenCalledTimes(1);
  });
});
