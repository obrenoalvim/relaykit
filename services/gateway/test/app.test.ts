import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { buildRegistry } from '../src/registry.js';

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response;
}

function buildTestSpecialists() {
  return buildRegistry({
    statsUrl: 'http://stats',
    langUrl: 'http://lang',
    keywordUrl: 'http://keyword',
    retries: 0,
    timeoutMs: 500,
  });
}

describe('gateway HTTP API', () => {
  it('POST /analyze returns 200 and combined results when all specialists succeed', async () => {
    const specialists = buildTestSpecialists();
    const fetchImpl = (async (url: string) => {
      if (url.startsWith('http://stats')) return jsonResponse({ words: 2 });
      if (url.startsWith('http://lang')) return jsonResponse({ language: 'en' });
      return jsonResponse({ keywords: [] });
    }) as unknown as typeof fetch;

    const app = createApp({ specialists, relayDeps: { fetchImpl } });
    const res = await request(app).post('/analyze').send({ text: 'hello there' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('complete');
  });

  it('POST /analyze returns 207 when a specialist is unavailable', async () => {
    const specialists = buildTestSpecialists();
    const fetchImpl = (async (url: string) => {
      if (url.startsWith('http://lang')) throw new Error('down');
      return jsonResponse({ ok: true });
    }) as unknown as typeof fetch;

    const app = createApp({ specialists, relayDeps: { fetchImpl } });
    const res = await request(app).post('/analyze').send({ text: 'hello there' });

    expect(res.status).toBe(207);
    expect(res.body.status).toBe('degraded');
  });

  it('POST /analyze rejects empty text', async () => {
    const app = createApp({ specialists: buildTestSpecialists() });
    const res = await request(app).post('/analyze').send({ text: '   ' });
    expect(res.status).toBe(400);
  });

  it('GET /health aggregates specialist health', async () => {
    const specialists = buildTestSpecialists();
    const fetchImpl = (async () => ({ ok: true }) as Response) as unknown as typeof fetch;
    const app = createApp({ specialists, healthDeps: { fetchImpl } });

    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.gateway).toBe('ok');
    expect(res.body.specialists.stats.status).toBe('up');
  });
});
