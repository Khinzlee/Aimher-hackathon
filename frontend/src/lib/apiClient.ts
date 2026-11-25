// Thin REST client for the AIMHER NestJS API.
// Uses the documented response envelope and keeps the demo usable offline.

const configuredBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
const API_BASES = configuredBase
  ? [configuredBase]
  : ['http://localhost:3001/api', 'http://localhost:3002/api'];

// Backend integration is enabled by default; requests fall back to the local
// demo store when the API is unavailable.
export const isApiConfigured: boolean = true;

const TOKEN_KEY = 'aimher-token';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  const direct = window.localStorage.getItem(TOKEN_KEY);
  if (direct) return direct;
  const raw = window.localStorage.getItem('aimher-auth') ?? window.localStorage.getItem('aimher-tokens');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed.accessToken ?? parsed.access_token ?? parsed.token ?? null;
  } catch {
    return raw;
  }
}

export function saveAccessToken(token: string | null | undefined) {
  if (typeof window === 'undefined' || !token) return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken() {
  if (typeof window === 'undefined') return;
  [TOKEN_KEY, 'aimher-auth', 'aimher-tokens'].forEach((key) => window.localStorage.removeItem(key));
}

function responseMessage(body: unknown, status: number): string {
  const message = (body as { message?: unknown } | null)?.message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.join(', ');
  return `API request failed (${status})`;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  let lastNetworkError: unknown;

  for (const base of API_BASES) {
    let response: Response;
    try {
      response = await fetch(`${base}${path}`, {
        ...init,
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...init.headers,
        },
      });
    } catch (error) {
      // Try the next local API port; keep validation/auth errors on the first host.
      lastNetworkError = error;
      continue;
    }

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const error = new Error(responseMessage(body, response.status)) as Error & {
        errors?: unknown;
        status?: number;
      };
      error.errors = body?.errors;
      error.status = response.status;
      throw error;
    }

    const body = await response.json();
    // AIMHER envelope: { success, status, message, data, meta }
    return (body && typeof body === 'object' && 'data' in body ? body.data : body) as T;
  }

  throw lastNetworkError ?? new Error('API unavailable');
}

/** Try the backend, but keep the app usable when it is offline. */
export async function withApiFallback<T>(
  remote: () => Promise<T>,
  local: () => Promise<T>
): Promise<T> {
  if (isApiConfigured) {
    try {
      return await remote();
    } catch {
      // Offline or not authenticated — use local data.
    }
  }
  return local();
}
