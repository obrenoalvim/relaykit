import type { AnalyzeResponse, HealthResponse } from './types.js';

export function getGatewayUrl(): string {
  return process.env.NEXT_PUBLIC_GATEWAY_URL ?? 'http://localhost:4000';
}

export async function analyzeText(
  text: string,
  fetchImpl: typeof fetch = fetch,
): Promise<AnalyzeResponse> {
  const res = await fetchImpl(`${getGatewayUrl()}/analyze`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok && res.status !== 207) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `gateway responded with status ${res.status}`);
  }

  return (await res.json()) as AnalyzeResponse;
}

export async function fetchHealth(fetchImpl: typeof fetch = fetch): Promise<HealthResponse> {
  const res = await fetchImpl(`${getGatewayUrl()}/health`);
  if (!res.ok) {
    throw new Error(`gateway health check responded with status ${res.status}`);
  }
  return (await res.json()) as HealthResponse;
}
