import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeading({ title, subtitle, className }: SectionHeadingProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <h2 className="text-3xl md:text-4xl text-light-text dark:text-dark-text tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="font-sans font-light text-light-text-muted dark:text-dark-text-muted text-base max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}
