'use client';

import { MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';

const mounted = () => true;
const unmounted = () => false;

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const ready = useSyncExternalStore(() => () => undefined, mounted, unmounted);

  const dark = ready && resolvedTheme === 'dark';
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
