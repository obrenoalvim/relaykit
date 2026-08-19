import { afterEach, describe, expect, it, vi } from 'vitest';
import { analyzeText, fetchHealth } from './api';

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('analyzeText', () => {
  it('posts the text and returns the parsed response', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ status: 'complete', results: {} }));
    const result = await analyzeText('hello', fetchImpl as unknown as typeof fetch);

    expect(result).toEqual({ status: 'complete', results: {} });
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining('/analyze'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('treats HTTP 207 as a valid degraded response', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ status: 'degraded', results: {} }, true, 207));
    const result = await analyzeText('hello', fetchImpl as unknown as typeof fetch);
    expect(result.status).toBe('degraded');
  });

  it('throws with the gateway error message on failure', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ error: 'text field must be a non-empty string' }, false, 400));
    await expect(analyzeText('', fetchImpl as unknown as typeof fetch)).rejects.toThrow(
      'text field must be a non-empty string',
    );
  });
});

describe('fetchHealth', () => {
  it('returns the parsed health payload', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ gateway: 'ok', specialists: {} }));
    const result = await fetchHealth(fetchImpl as unknown as typeof fetch);
    expect(result.gateway).toBe('ok');
  });

  it('throws when the gateway is unreachable', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, false, 503));
    await expect(fetchHealth(fetchImpl as unknown as typeof fetch)).rejects.toThrow('status 503');
  });
});
