'use client';

import { useEffect } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

    const applyTheme = (mode: ThemeMode) => {
      const resolved = mode === 'system' ? (prefersDark() ? 'dark' : 'light') : mode;
      if (resolved === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', mode);
      currentMode = mode;
    };

    let currentMode: ThemeMode = 'system';

    // Immediate apply from localStorage/system to avoid flash
    const stored = localStorage.getItem('theme') as ThemeMode | null;
    const initialMode = stored ?? 'system';
    applyTheme(initialMode);

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = () => {
      if (currentMode === 'system') {
        applyTheme('system');
      }
    };
    mql.addEventListener('change', onSystemChange);

    // Sync with server preference if available
    const syncFromServer = async () => {
      try {
        const res = await fetch('/api/user', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.themePreference === 'light' || data.themePreference === 'dark' || data.themePreference === 'system') {
            applyTheme(data.themePreference);
          }
        }
      } catch {
        // ignore
      }
    };

    syncFromServer();

    return () => {
      mql.removeEventListener('change', onSystemChange);
    };
  }, []);

  return <>{children}</>;
}
