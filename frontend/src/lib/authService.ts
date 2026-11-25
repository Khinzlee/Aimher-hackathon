// Auth wiring for the NestJS API, with a demo fallback when offline.

import { apiFetch, saveAccessToken, withApiFallback } from './apiClient';

export interface AuthResult {
  accessToken: string | null;
  tokenType?: string;
  expiresIn?: number;
  demo?: boolean;
}

interface TokenResponse {
  accessToken?: string;
  access_token?: string;
  token?: string;
  tokenType?: string;
  expiresIn?: number;
}

function toAuthResult(raw: TokenResponse): AuthResult {
  const token = raw?.accessToken ?? raw?.access_token ?? raw?.token ?? null;
  saveAccessToken(token);
  return {
    accessToken: token,
    tokenType: raw?.tokenType ?? 'Bearer',
    expiresIn: raw?.expiresIn,
  };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  return withApiFallback(
    async () => {
      const raw = await apiFetch<TokenResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      return toAuthResult(raw);
    },
    async () => ({ accessToken: null, demo: true })
  );
}

export async function register(name: string, email: string, password: string): Promise<AuthResult> {
  return withApiFallback(
    async () => {
      const raw = await apiFetch<TokenResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      return toAuthResult(raw);
    },
    async () => ({ accessToken: null, demo: true })
  );
}
