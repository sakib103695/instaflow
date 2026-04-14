/**
 * Small wrapper around fetch() for calls to third-party APIs (OpenRouter,
 * ElevenLabs). Adds:
 *   - a hard timeout (the default fetch has none, so a hung upstream will
 *     pin a request indefinitely),
 *   - one retry on 429 or 5xx after a short backoff,
 *   - a more legible error when it gives up.
 *
 * Use only for upstream HTTP calls, never for our own DB operations.
 */
export type UpstreamOpts = RequestInit & {
  /** Abort + reject after this many ms. Default 20s. */
  timeoutMs?: number;
  /** Retry once on 429 / 5xx / network error. Default true. */
  retry?: boolean;
  /** How long to wait before the retry. Default 500ms. */
  retryDelayMs?: number;
};

export async function upstreamFetch(url: string, opts: UpstreamOpts = {}): Promise<Response> {
  const {
    timeoutMs = 20_000,
    retry = true,
    retryDelayMs = 500,
    signal: callerSignal,
    ...rest
  } = opts;

  const attempt = async (): Promise<Response> => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const signal = mergeSignals(controller.signal, callerSignal);
    try {
      return await fetch(url, { ...rest, signal });
    } finally {
      clearTimeout(t);
    }
  };

  try {
    const res = await attempt();
    if (retry && shouldRetry(res.status)) {
      await sleep(retryDelayMs);
      return await attempt();
    }
    return res;
  } catch (err) {
    if (retry) {
      await sleep(retryDelayMs);
      return await attempt();
    }
    throw err;
  }
}

function shouldRetry(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function mergeSignals(a: AbortSignal, b?: AbortSignal | null): AbortSignal {
  if (!b) return a;
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  a.addEventListener('abort', onAbort);
  b.addEventListener('abort', onAbort);
  return controller.signal;
}
