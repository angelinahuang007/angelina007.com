'use client';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type Appearance = 'light' | 'dark';
type AppearanceState = {
  appearance: Appearance;
  automatic: boolean;
  mounted: boolean;
  toggleAppearance: () => void;
};

const AppearanceContext = createContext<AppearanceState | null>(null);

function themeForTime(): Appearance {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 19 ? 'light' : 'dark';
}

function AppearanceProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme, setTheme } = useTheme();
  // Start each visit in Auto. A manual choice lasts while navigating the site.
  const [automatic, setAutomatic] = useState(true);
  const [mounted, setMounted] = useState(false);
  // Keep the server and first client frame identical, even with a saved dark theme.
  const appearance = mounted && resolvedTheme === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    if (!automatic) return;
    const updateClock = () => setTheme(themeForTime());
    updateClock();
    setMounted(true);
    const clock = window.setInterval(updateClock, 60_000);
    document.addEventListener('visibilitychange', updateClock);
    return () => {
      window.clearInterval(clock);
      document.removeEventListener('visibilitychange', updateClock);
    };
  }, [automatic, setTheme]);

  return (
    <AppearanceContext.Provider value={{
      appearance,
      automatic,
      mounted,
      toggleAppearance: () => {
        setAutomatic(false);
        setTheme(appearance === 'dark' ? 'light' : 'dark');
      },
    }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error('useAppearance must be used within ThemeProvider');
  return context;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AppearanceProvider>{children}</AppearanceProvider>
    </NextThemesProvider>
  );
}
