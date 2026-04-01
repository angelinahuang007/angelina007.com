'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 transition-colors duration-200 hover:text-light-accent dark:hover:text-dark-accent text-light-text-muted dark:text-dark-text-muted"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <FiSun className="w-[18px] h-[18px]" />
      ) : (
        <FiMoon className="w-[18px] h-[18px]" />
      )}
    </button>
  );
}
