'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-xl">
        {/* Error Icon */}
        <div className="mb-8 w-16 h-16 rounded-md bg-red-500 dark:bg-red-400 mx-auto flex items-center justify-center text-white text-3xl font-bold">
          !
        </div>

        {/* Error Message */}
        <h1 className="text-3xl md:text-4xl font-bold text-light-text dark:text-dark-text mb-4">
          Oops! Something went wrong
        </h1>

        <p className="text-lg text-light-text-muted dark:text-dark-text-muted mb-4 leading-relaxed">
          We encountered an unexpected error. Don't worry, we're working on fixing it!
        </p>

        {/* Error Details (if in development) */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-8 p-4 rounded-sm bg-red-500/10 dark:bg-red-400/10 border border-red-500/30 dark:border-red-400/30 text-left">
            <p className="text-sm font-mono text-red-600 dark:text-red-400">
              {error.message}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-4">
          <Button size="lg" variant="primary" onClick={reset}>
            Try Again
          </Button>
          <Button size="lg" variant="secondary" onClick={() => window.location.href = '/'}>
            Go Home
          </Button>
        </div>

        {/* Support Message */}
        <p className="mt-8 text-sm text-light-text-muted dark:text-dark-text-muted">
          If this keeps happening, feel free to{' '}
          <a href="/contact" className="text-light-accent dark:text-dark-accent hover:underline">
            contact me
          </a>
          .
        </p>
      </div>
    </div>
  );
}
