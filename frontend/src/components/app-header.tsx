'use client';

import { LogOutIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSession } from '@/hooks/use-session';
import { clearSession } from '@/lib/auth';

export function AppHeader() {
  const router = useRouter();
  const session = useSession();

  function logout() {
    clearSession();
    router.replace('/login');
  }

  return (
    <header className="bg-card border-b">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 md:px-6">
        <Link
          href="/patients"
          className="font-heading text-sm font-semibold tracking-tight"
        >
          Patients
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {session && (
            <>
              <span className="text-muted-foreground hidden text-sm sm:inline">
                {session.email}
              </span>
              <Badge variant={session.role === 'admin' ? 'success' : 'warning'}>
                {session.role}
              </Badge>
            </>
          )}
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Log out"
            onClick={logout}
          >
            <LogOutIcon />
          </Button>
        </div>
      </div>
    </header>
  );
}
