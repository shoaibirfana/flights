// LiteAPI (Nuitee Connect) client: https://docs.liteapi.travel
// One API key covers hotels, flights and reference data. Sandbox and production share the
// same host; the key decides the environment.

export const LITEAPI_BASE = process.env.LITEAPI_BASE_URL || "https://api.liteapi.travel/v3.0";

export class ProviderError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

function key(): string {
  const k = process.env.LITEAPI_KEY?.trim();
  if (!k) throw new ProviderError("Search is not configured yet (missing LITEAPI_KEY).", 503);
  return k;
}

export async function lite<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${LITEAPI_BASE}${path}`, {
    ...init,
    headers: { "X-API-Key": key(), Accept: "application/json", "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`LiteAPI ${path} error`, res.status, JSON.stringify(json).slice(0, 1000));
    // "No availability" comes back as an error; treat it as an empty result upstream.
    if (json?.error?.code === 2001) return { data: [] } as T;
    const msg = json?.error?.message || json?.message || `Travel provider error (${res.status})`;
    throw new ProviderError(msg, res.status >= 500 ? 502 : 400);
  }
  return json as T;
}
