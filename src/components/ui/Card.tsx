import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  [key: string]: any;
}

export function Card({ children, className, hover = true, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-md border border-light-text/8 dark:border-dark-text/8 bg-light-bg dark:bg-dark-bg-secondary',
        hover && 'hover:shadow-lg dark:hover:shadow-dark-accent/10 transition-all duration-300 hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
