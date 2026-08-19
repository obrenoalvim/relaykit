import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp as createGatewayApp } from '../../services/gateway/src/app.js';
import { buildRegistry } from '../../services/gateway/src/registry.js';
import { createApp as createKeywordApp } from '../../services/keyword-service/src/app.js';
import { createApp as createLangApp } from '../../services/lang-service/src/app.js';
import { createApp as createStatsApp } from '../../services/stats-service/src/app.js';
import { startApp, stopServer, type RunningServer } from './testServer.js';

const RESET_TIMEOUT_MS = 300;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('resilience: gateway degrades gracefully when a specialist goes down', () => {
  let stats: RunningServer;
  let keywords: RunningServer;
  let lang: RunningServer;
  let langPort: number;
  let gateway: RunningServer;

  beforeAll(async () => {
    stats = await startApp(createStatsApp());
    keywords = await startApp(createKeywordApp());
    lang = await startApp(createLangApp());
    langPort = Number(new URL(lang.baseUrl).port);

    const specialists = buildRegistry({
      statsUrl: stats.baseUrl,
      langUrl: lang.baseUrl,
      keywordUrl: keywords.baseUrl,
      timeoutMs: 300,
      retries: 0,
      failureThreshold: 2,
      resetTimeoutMs: RESET_TIMEOUT_MS,
    });
    gateway = await startApp(createGatewayApp({ specialists }));
  });

  afterAll(async () => {
    await Promise.all([stats, keywords, gateway].map((s) => stopServer(s.server)));
    await stopServer(lang.server);
  });

  async function analyze(): Promise<{ status: number; body: any }> {
    const res = await fetch(`${gateway.baseUrl}/analyze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'The lazy dog watches the quick fox run past the fence.' }),
    });
    return { status: res.status, body: await res.json() };
  }

  it('starts fully healthy', async () => {
    const { status, body } = await analyze();
    expect(status).toBe(200);
    expect(body.status).toBe('complete');
  });

  it('degrades but keeps serving the other specialists once lang-service goes down', async () => {
    await stopServer(lang.server);

    const first = await analyze();
    expect(first.status).toBe(207);
    expect(first.body.results.language.status).toBe('unavailable');
    expect(first.body.results.stats.status).toBe('ok');
    expect(first.body.results.keywords.status).toBe('ok');

    // Second failure trips the breaker (failureThreshold = 2).
    await analyze();

    const third = await analyze();
    expect(third.body.results.language.reason).toBe('circuit_open');
  });

  it('recovers once lang-service comes back and the breaker resets', async () => {
    await wait(RESET_TIMEOUT_MS + 100);
    lang = await startApp(createLangApp(), langPort);

    const recovered = await analyze();
    expect(recovered.status).toBe(200);
    expect(recovered.body.results.language.status).toBe('ok');
  });
});
