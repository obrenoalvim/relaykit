import type { SpecialistConfig } from './registry.js';

export interface SpecialistHealth {
  name: string;
  status: 'up' | 'down';
  circuit: 'closed' | 'open' | 'half-open';
}

export interface GatewayHealth {
  gateway: 'ok';
  specialists: Record<string, SpecialistHealth>;
}

export interface HealthDeps {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

async function pingHealth(spec: SpecialistConfig, deps: HealthDeps): Promise<'up' | 'down'> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const timeoutMs = deps.timeoutMs ?? 1000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchImpl(`${spec.baseUrl}/health`, { signal: controller.signal });
    return res.ok ? 'up' : 'down';
  } catch {
    return 'down';
  } finally {
    clearTimeout(timer);
  }
}

export async function checkHealth(
  specialists: SpecialistConfig[],
  deps: HealthDeps = {},
): Promise<GatewayHealth> {
  const entries = await Promise.all(
    specialists.map(async (spec) => {
      const status = await pingHealth(spec, deps);
      const health: SpecialistHealth = {
        name: spec.name,
        status,
        circuit: spec.breaker.getState(),
      };
      return [spec.key, health] as const;
    }),
  );

  return { gateway: 'ok', specialists: Object.fromEntries(entries) };
}
