import { describe, expect, it, vi } from 'vitest';
import { CircuitBreaker, CircuitOpenError } from '../src/circuitBreaker.js';

function makeClock(start = 0) {
  let current = start;
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
  };
}

describe('CircuitBreaker', () => {
  it('starts closed and allows calls to pass through', async () => {
    const breaker = new CircuitBreaker('svc', { failureThreshold: 3, resetTimeoutMs: 1000 });
    const result = await breaker.execute(async () => 'ok');
    expect(result).toBe('ok');
    expect(breaker.getState()).toBe('closed');
  });

  it('opens after reaching the failure threshold', async () => {
    const breaker = new CircuitBreaker('svc', { failureThreshold: 2, resetTimeoutMs: 1000 });
    const fail = async () => {
      throw new Error('boom');
    };

    await expect(breaker.execute(fail)).rejects.toThrow('boom');
    expect(breaker.getState()).toBe('closed');

    await expect(breaker.execute(fail)).rejects.toThrow('boom');
    expect(breaker.getState()).toBe('open');
  });

  it('rejects immediately with CircuitOpenError while open', async () => {
    const breaker = new CircuitBreaker('svc', { failureThreshold: 1, resetTimeoutMs: 1000 });
    const fn = vi.fn(async () => {
      throw new Error('boom');
    });

    await expect(breaker.execute(fn)).rejects.toThrow('boom');
    expect(breaker.getState()).toBe('open');

    await expect(breaker.execute(fn)).rejects.toThrow(CircuitOpenError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('moves to half-open after the reset timeout and closes on success', async () => {
    const clock = makeClock();
    const breaker = new CircuitBreaker('svc', {
      failureThreshold: 1,
      resetTimeoutMs: 500,
      now: clock.now,
    });

    await expect(
      breaker.execute(async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(breaker.getState()).toBe('open');

    clock.advance(499);
    expect(breaker.getState()).toBe('open');

    clock.advance(2);
    expect(breaker.getState()).toBe('half-open');

    const result = await breaker.execute(async () => 'recovered');
    expect(result).toBe('recovered');
    expect(breaker.getState()).toBe('closed');
  });

  it('reopens if the half-open trial fails', async () => {
    const clock = makeClock();
    const breaker = new CircuitBreaker('svc', {
      failureThreshold: 1,
      resetTimeoutMs: 500,
      now: clock.now,
    });
    const fail = async () => {
      throw new Error('boom');
    };

    await expect(breaker.execute(fail)).rejects.toThrow('boom');
    clock.advance(600);
    expect(breaker.getState()).toBe('half-open');

    await expect(breaker.execute(fail)).rejects.toThrow('boom');
    expect(breaker.getState()).toBe('open');
  });
});
