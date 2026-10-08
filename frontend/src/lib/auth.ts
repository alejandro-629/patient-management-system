import type { Role } from '@/lib/types';

export const TOKEN_COOKIE = 'pms_token';

export interface Session {
  token: string;
  email: string;
  role: Role;
  expiresAt: number;
}

interface TokenClaims {
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
}

/** Reads claims without verifying the signature. The API is the authority. */
export function decodeToken(token: string): TokenClaims | null {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as TokenClaims;
  } catch {
    return null;
  }
}

export function sessionFromToken(token: string | undefined): Session | null {
  if (!token) return null;
  const claims = decodeToken(token);
  if (!claims?.email || !claims.exp) return null;
  if (claims.role !== 'admin' && claims.role !== 'user') return null;
  if (claims.exp * 1000 <= Date.now()) return null;
  return {
    token,
    email: claims.email,
    role: claims.role,
    expiresAt: claims.exp * 1000,
  };
}

export function readCookie(name: string, source = ''): string | undefined {
  const match = source.split('; ').find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

export function readSession(cookieHeader?: string): Session | null {
  const source =
    cookieHeader ?? (typeof document === 'undefined' ? '' : document.cookie);
  return sessionFromToken(readCookie(TOKEN_COOKIE, source));
}

const sessionListeners = new Set<() => void>();
let sessionSnapshot: Session | null = null;
let sessionCookie = '';

export function subscribeSession(listener: () => void): () => void {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

/** Stable between renders while the cookie is unchanged. Required by useSyncExternalStore. */
export function getSessionSnapshot(): Session | null {
  if (typeof document === 'undefined') return null;
  if (document.cookie !== sessionCookie) {
    sessionCookie = document.cookie;
    sessionSnapshot = readSession();
  }
  return sessionSnapshot;
}

function publishSession(): void {
  sessionCookie = '';
  sessionListeners.forEach((listener) => listener());
}

export function persistSession(token: string): void {
  const session = sessionFromToken(token);
  const maxAge = session
    ? Math.max(1, Math.floor((session.expiresAt - Date.now()) / 1000))
    : 0;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; SameSite=Strict; Max-Age=${maxAge}${secure}`;
  publishSession();
}

export function clearSession(): void {
  document.cookie = `${TOKEN_COOKIE}=; Path=/; SameSite=Strict; Max-Age=0`;
  publishSession();
}
