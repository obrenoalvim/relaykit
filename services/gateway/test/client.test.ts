import { describe, expect, it, vi } from 'vitest';
import { postJson, RequestTimeoutError } from '../src/client.js';

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

describe('postJson', () => {
  it('returns parsed JSON on success', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ hello: 'world' }));
    const result = await postJson('http://svc/analyze', { text: 'hi' }, {
      timeoutMs: 1000,
      retries: 0,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result).toEqual({ hello: 'world' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('throws when the response is not ok, without retrying successfully', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, false, 500));
    await expect(
      postJson('http://svc/analyze', {}, {
        timeoutMs: 1000,
        retries: 0,
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow('failed with status 500');
  });

  it('retries on failure and succeeds on a later attempt', async () => {
    let calls = 0;
    const fetchImpl = vi.fn(async () => {
      calls += 1;
      if (calls < 3) throw new Error('network blip');
      return jsonResponse({ ok: true });
    });

    const result = await postJson('http://svc/analyze', {}, {
      timeoutMs: 1000,
      retries: 2,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      delayImpl: async () => {},
    });

    expect(result).toEqual({ ok: true });
    expect(calls).toBe(3);
  });

  it('throws the last error once retries are exhausted', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('always fails');
    });

    await expect(
      postJson('http://svc/analyze', {}, {
        timeoutMs: 1000,
        retries: 2,
        fetchImpl: fetchImpl as unknown as typeof fetch,
        delayImpl: async () => {},
      }),
    ).rejects.toThrow('always fails');
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('raises RequestTimeoutError when the request is aborted', async () => {
    const fetchImpl = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }) as Promise<Response>,
    );

    await expect(
      postJson('http://svc/analyze', {}, {
        timeoutMs: 10,
        retries: 0,
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(RequestTimeoutError);
  });
});
