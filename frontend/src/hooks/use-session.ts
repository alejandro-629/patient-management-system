'use client';

import { useSyncExternalStore } from 'react';
import { getSessionSnapshot, subscribeSession, type Session } from '@/lib/auth';

export function useSession(): Session | null {
  return useSyncExternalStore(subscribeSession, getSessionSnapshot, () => null);
}
