import { CircuitBreaker } from './circuitBreaker.js';

export interface SpecialistConfig {
  key: string;
  name: string;
  baseUrl: string;
  timeoutMs: number;
  retries: number;
  breaker: CircuitBreaker;
}

export interface RegistryOptions {
  statsUrl?: string | undefined;
  langUrl?: string | undefined;
  keywordUrl?: string | undefined;
  timeoutMs?: number | undefined;
  retries?: number | undefined;
  failureThreshold?: number | undefined;
  resetTimeoutMs?: number | undefined;
  now?: (() => number) | undefined;
}

export function buildRegistry(options: RegistryOptions = {}): SpecialistConfig[] {
  const timeoutMs = options.timeoutMs ?? 2000;
  const retries = options.retries ?? 1;
  const failureThreshold = options.failureThreshold ?? 3;
  const resetTimeoutMs = options.resetTimeoutMs ?? 10_000;

  const specs: Array<{ key: string; name: string; baseUrl: string }> = [
    { key: 'stats', name: 'stats-service', baseUrl: options.statsUrl ?? 'http://localhost:4001' },
    { key: 'language', name: 'lang-service', baseUrl: options.langUrl ?? 'http://localhost:4002' },
    { key: 'keywords', name: 'keyword-service', baseUrl: options.keywordUrl ?? 'http://localhost:4003' },
  ];

  return specs.map((spec) => ({
    ...spec,
    timeoutMs,
    retries,
    breaker: new CircuitBreaker(spec.name, { failureThreshold, resetTimeoutMs, now: options.now }),
  }));
}

export function registryFromEnv(env: NodeJS.ProcessEnv = process.env): SpecialistConfig[] {
  return buildRegistry({
    statsUrl: env.STATS_SERVICE_URL,
    langUrl: env.LANG_SERVICE_URL,
    keywordUrl: env.KEYWORD_SERVICE_URL,
    timeoutMs: env.SPECIALIST_TIMEOUT_MS ? Number(env.SPECIALIST_TIMEOUT_MS) : undefined,
    retries: env.SPECIALIST_RETRIES ? Number(env.SPECIALIST_RETRIES) : undefined,
    failureThreshold: env.CIRCUIT_FAILURE_THRESHOLD ? Number(env.CIRCUIT_FAILURE_THRESHOLD) : undefined,
    resetTimeoutMs: env.CIRCUIT_RESET_TIMEOUT_MS ? Number(env.CIRCUIT_RESET_TIMEOUT_MS) : undefined,
  });
}
