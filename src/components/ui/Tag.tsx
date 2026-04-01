import { cn } from '@/lib/utils';

interface TagProps {
  label: string;
  variant?: 'default' | 'outline';
  className?: string;
}

export function Tag({ label, variant = 'default', className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-block px-2.5 py-0.5 rounded text-xs font-medium transition-colors',
        variant === 'default'
          ? 'bg-light-accent/10 dark:bg-dark-accent/10 text-light-accent dark:text-dark-accent'
          : 'border border-light-accent/30 dark:border-dark-accent/30 text-light-accent dark:text-dark-accent',
        className
      )}
    >
      {label}
    </span>
  );
}
