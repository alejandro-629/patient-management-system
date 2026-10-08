import { clearSession, readSession } from '@/lib/auth';
import type { ApiErrorBody } from '@/lib/types';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorBody,
  ) {
    super(Array.isArray(body.message) ? body.message.join(', ') : body.message);
    this.name = 'ApiError';
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = readSession()?.token;
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (
    response.status === 401 &&
    path !== '/auth/login' &&
    typeof window !== 'undefined'
  ) {
    clearSession();
    const next = new URL('/login', window.location.origin);
    next.searchParams.set('reason', 'expired');
    window.location.assign(next);
  }

  const text = await response.text();
  const body: unknown = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const errorBody: ApiErrorBody =
      body && typeof body === 'object' && 'message' in body
        ? (body as ApiErrorBody)
        : {
            statusCode: response.status,
            error: response.statusText,
            message: 'Request failed',
          };
    throw new ApiError(response.status, errorBody);
  }

  return body as T;
}
