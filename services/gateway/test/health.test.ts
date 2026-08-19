import { describe, expect, it } from 'vitest';
import { checkHealth } from '../src/health.js';
import { buildRegistry } from '../src/registry.js';

describe('checkHealth', () => {
  it('reports up for reachable specialists and down for unreachable ones', async () => {
    const specialists = buildRegistry({
      statsUrl: 'http://stats',
      langUrl: 'http://lang',
      keywordUrl: 'http://keyword',
    });

    const fetchImpl = (async (url: string) => {
      if (url.startsWith('http://lang')) throw new Error('connection refused');
      return { ok: true } as Response;
    }) as unknown as typeof fetch;

    const health = await checkHealth(specialists, { fetchImpl });

    expect(health.gateway).toBe('ok');
    expect(health.specialists.stats?.status).toBe('up');
    expect(health.specialists.language?.status).toBe('down');
    expect(health.specialists.keywords?.status).toBe('up');
  });

  it('includes the current circuit state per specialist', async () => {
    const specialists = buildRegistry({ statsUrl: 'http://stats', langUrl: 'http://lang', keywordUrl: 'http://keyword' });
    const fetchImpl = (async () => ({ ok: true }) as Response) as unknown as typeof fetch;

    const health = await checkHealth(specialists, { fetchImpl });

    expect(health.specialists.stats?.circuit).toBe('closed');
  });
});
