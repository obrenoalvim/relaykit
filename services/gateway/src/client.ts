export interface FetchJsonOptions {
  timeoutMs: number;
  retries: number;
  retryDelayMs?: number | undefined;
  fetchImpl?: typeof fetch | undefined;
  delayImpl?: ((ms: number) => Promise<void>) | undefined;
}

export class RequestTimeoutError extends Error {
  constructor(url: string) {
    super(`request to ${url} timed out`);
    this.name = 'RequestTimeoutError';
  }
}

const defaultDelay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function postJson<T>(
  url: string,
  body: unknown,
  options: FetchJsonOptions,
): Promise<T> {
  const { timeoutMs, retries, retryDelayMs = 100 } = options;
  const fetchImpl = options.fetchImpl ?? fetch;
  const delayImpl = options.delayImpl ?? defaultDelay;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetchImpl(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`request to ${url} failed with status ${res.status}`);
      }
      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timer);
      lastError = (error as { name?: string })?.name === 'AbortError' ? new RequestTimeoutError(url) : error;

      if (attempt < retries) {
        await delayImpl(retryDelayMs);
      }
    }
  }

  throw lastError;
}
