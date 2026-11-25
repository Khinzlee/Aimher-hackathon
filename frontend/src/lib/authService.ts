// Auth wiring for the NestJS API, with a demo fallback when offline.

import { apiFetch, saveAccessToken, withApiFallback } from './apiClient';

export interface AuthResult {
  accessToken: string | null;
  tokenType?: string;
  expiresIn?: number;
  demo?: boolean;
}

export async function login(email: string, password: string): Promise<AuthResult> {
  return withApiFallback(
    async () => {
      const raw = await apiFetch<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const token = raw?.accessToken ?? raw?.access_token ?? raw?.token ?? null;
      saveAccessToken(token);
      return {
        accessToken: token,
        tokenType: raw?.tokenType ?? 'Bearer',
        expiresIn: raw?.expiresIn,
      };
    },
    async () => ({ accessToken: null, demo: true })
  );
}

export async function register(name: string, email: string, password: string): Promise<AuthResult> {
  return withApiFallback(
    async () => {
      const raw = await apiFetch<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      const token = raw?.accessToken ?? raw?.access_token ?? raw?.token ?? null;
      saveAccessToken(token);
      return {
        accessToken: token,
        tokenType: raw?.tokenType ?? 'Bearer',
        expiresIn: raw?.expiresIn,
      };
    },
    async () => ({ accessToken: null, demo: true })
  );
}
