'use client';

import { FiSun, FiMoon } from 'react-icons/fi';
import { useAppearance } from './ThemeProvider';
import { cn } from '@/lib/utils';

export function ThemeToggle({ onScene = false }: { onScene?: boolean }) {
  const { appearance, automatic, mounted, toggleAppearance } = useAppearance();

  if (!mounted) {
    return <div className="w-11 h-11" aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      onClick={toggleAppearance}
      className={cn(
        'flex h-11 w-11 items-center justify-center transition-opacity duration-200 hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current',
        onScene ? 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]' : 'text-light-text-muted dark:text-dark-text-muted'
      )}
      aria-label={appearance === 'dark' ? 'Switch to light theme and Studio' : 'Switch to dark theme and Lab'}
      title={`${automatic ? 'Auto · ' : ''}${appearance === 'dark' ? 'Lab at night. Switch to Studio' : 'Daylight Studio. Switch to Lab'}`}
    >
      {appearance === 'dark' ? (
        <FiSun className="w-[18px] h-[18px]" aria-hidden="true" />
      ) : (
        <FiMoon className="w-[18px] h-[18px]" aria-hidden="true" />
      )}
    </button>
  );
}
