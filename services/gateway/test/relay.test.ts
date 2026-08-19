import { describe, expect, it } from 'vitest';
import { aggregateAnalysis } from '../src/relay.js';
import { buildRegistry } from '../src/registry.js';

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response;
}

function buildTestRegistry() {
  return buildRegistry({
    statsUrl: 'http://stats',
    langUrl: 'http://lang',
    keywordUrl: 'http://keyword',
    retries: 0,
    timeoutMs: 500,
    failureThreshold: 2,
  });
}

describe('aggregateAnalysis', () => {
  it('returns complete status when every specialist succeeds', async () => {
    const specialists = buildTestRegistry();
    const fetchImpl = (async (url: string) => {
      if (url.startsWith('http://stats')) return jsonResponse({ words: 3 });
      if (url.startsWith('http://lang')) return jsonResponse({ language: 'en' });
      return jsonResponse({ keywords: [] });
    }) as unknown as typeof fetch;

    const result = await aggregateAnalysis('hi there friend', specialists, { fetchImpl });

    expect(result.status).toBe('complete');
    expect(result.results.stats).toEqual({ status: 'ok', data: { words: 3 } });
    expect(result.results.language).toEqual({ status: 'ok', data: { language: 'en' } });
    expect(result.results.keywords).toEqual({ status: 'ok', data: { keywords: [] } });
  });

  it('degrades gracefully when one specialist fails', async () => {
    const specialists = buildTestRegistry();
    const fetchImpl = (async (url: string) => {
      if (url.startsWith('http://stats')) return jsonResponse({ words: 3 });
      if (url.startsWith('http://lang')) throw new Error('connection refused');
      return jsonResponse({ keywords: [] });
    }) as unknown as typeof fetch;

    const result = await aggregateAnalysis('hi there friend', specialists, { fetchImpl });

    expect(result.status).toBe('degraded');
    expect(result.results.stats.status).toBe('ok');
    expect(result.results.language).toEqual({ status: 'unavailable', reason: 'connection refused' });
    expect(result.results.keywords.status).toBe('ok');
  });

  it('reports unavailable via circuit_open once a specialist trips the breaker', async () => {
    const specialists = buildTestRegistry();
    const fetchImpl = (async (url: string) => {
      if (url.startsWith('http://lang')) throw new Error('down');
      return jsonResponse({ ok: true });
    }) as unknown as typeof fetch;

    await aggregateAnalysis('one', specialists, { fetchImpl });
    await aggregateAnalysis('two', specialists, { fetchImpl });
    const third = await aggregateAnalysis('three', specialists, { fetchImpl });

    expect(third.results.language).toEqual({ status: 'unavailable', reason: 'circuit_open' });
  });
});
