import { CircuitOpenError } from './circuitBreaker.js';
import { postJson, type FetchJsonOptions } from './client.js';
import type { SpecialistConfig } from './registry.js';

export interface OutcomeOk {
  status: 'ok';
  data: unknown;
}

export interface OutcomeUnavailable {
  status: 'unavailable';
  reason: string;
}

export type Outcome = OutcomeOk | OutcomeUnavailable;

export interface AggregatedResult {
  status: 'complete' | 'degraded';
  results: Record<string, Outcome>;
}

export interface RelayDeps {
  fetchImpl?: FetchJsonOptions['fetchImpl'];
  delayImpl?: FetchJsonOptions['delayImpl'];
}

async function callSpecialist(
  spec: SpecialistConfig,
  text: string,
  deps: RelayDeps,
): Promise<Outcome> {
  try {
    const data = await spec.breaker.execute(() =>
      postJson(`${spec.baseUrl}/analyze`, { text }, {
        timeoutMs: spec.timeoutMs,
        retries: spec.retries,
        fetchImpl: deps.fetchImpl,
        delayImpl: deps.delayImpl,
      }),
    );
    return { status: 'ok', data };
  } catch (error) {
    if (error instanceof CircuitOpenError) {
      return { status: 'unavailable', reason: 'circuit_open' };
    }
    const message = error instanceof Error ? error.message : 'unknown error';
    return { status: 'unavailable', reason: message };
  }
}

export async function aggregateAnalysis(
  text: string,
  specialists: SpecialistConfig[],
  deps: RelayDeps = {},
): Promise<AggregatedResult> {
  const outcomes = await Promise.all(
    specialists.map(async (spec) => [spec.key, await callSpecialist(spec, text, deps)] as const),
  );

  const results: Record<string, Outcome> = Object.fromEntries(outcomes);
  const degraded = outcomes.some(([, outcome]) => outcome.status === 'unavailable');

  return {
    status: degraded ? 'degraded' : 'complete',
    results,
  };
}
