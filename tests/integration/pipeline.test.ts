import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp as createGatewayApp } from '../../services/gateway/src/app.js';
import { buildRegistry } from '../../services/gateway/src/registry.js';
import { createApp as createKeywordApp } from '../../services/keyword-service/src/app.js';
import { createApp as createLangApp } from '../../services/lang-service/src/app.js';
import { createApp as createStatsApp } from '../../services/stats-service/src/app.js';
import { startApp, stopServer, type RunningServer } from './testServer.js';

describe('full pipeline: gateway relays to three real specialist services', () => {
  let stats: RunningServer;
  let lang: RunningServer;
  let keywords: RunningServer;
  let gateway: RunningServer;

  beforeAll(async () => {
    stats = await startApp(createStatsApp());
    lang = await startApp(createLangApp());
    keywords = await startApp(createKeywordApp());

    const specialists = buildRegistry({
      statsUrl: stats.baseUrl,
      langUrl: lang.baseUrl,
      keywordUrl: keywords.baseUrl,
    });
    gateway = await startApp(createGatewayApp({ specialists }));
  });

  afterAll(async () => {
    await Promise.all([stats, lang, keywords, gateway].map((s) => stopServer(s.server)));
  });

  it('aggregates real responses from every specialist', async () => {
    const res = await fetch(`${gateway.baseUrl}/analyze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: 'The gateway relays this text to every specialist service for analysis.',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.status).toBe('complete');
    expect(body.results.stats.status).toBe('ok');
    expect(body.results.stats.data.words).toBeGreaterThan(0);
    expect(body.results.language.status).toBe('ok');
    expect(body.results.language.data.language).toBe('en');
    expect(body.results.keywords.status).toBe('ok');
    expect(Array.isArray(body.results.keywords.data.keywords)).toBe(true);
  });

  it('reports every specialist as up through the health endpoint', async () => {
    const res = await fetch(`${gateway.baseUrl}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.gateway).toBe('ok');
    expect(body.specialists.stats.status).toBe('up');
    expect(body.specialists.language.status).toBe('up');
    expect(body.specialists.keywords.status).toBe('up');
  });

  it('rejects a request with no text before touching any specialist', async () => {
    const res = await fetch(`${gateway.baseUrl}/analyze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});
