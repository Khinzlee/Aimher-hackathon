// Thin REST client for the AIMHER NestJS API.
// Backend calls are opt-in via NEXT_PUBLIC_API_URL so the demo still works
// without a running API. See frontend/.env.example.

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api").replace(/\/$/, "");

export const isApiConfigured = Boolean(process.env.NEXT_PUBLIC_API_URL);

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const direct = window.localStorage.getItem("aimher-token");
  if (direct) return direct;
  const raw = window.localStorage.getItem("aimher-auth") ?? window.localStorage.getItem("aimher-tokens");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed.accessToken ?? parsed.access_token ?? parsed.token ?? null;
  } catch {
    return raw;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const error = new Error(body?.message ?? `API request failed (${response.status})`) as Error & {
      errors?: unknown;
    };
    error.errors = body?.errors;
    throw error;
  }

  const body = await response.json();
  // AIMHER envelope: { success, status, message, data, meta }
  return (body && typeof body === "object" && "data" in body ? body.data : body) as T;
}

/** Try the backend, but keep the app usable when it is offline. */
export async function withApiFallback<T>(
  remote: () => Promise<T>,
  local: () => Promise<T>
): Promise<T> {
  if (isApiConfigured()) {
    try {
      return await remote();
    } catch {
      // Offline or not authenticated — use local data.
    }
  }
  return local();
}
