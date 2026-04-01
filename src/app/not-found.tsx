import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-xl">
        {/* ASCII Art / Large 404 */}
        <div className="mb-8 text-6xl md:text-8xl font-bold text-light-accent dark:text-dark-accent">
          404
        </div>

        {/* Message */}
        <h1 className="text-3xl md:text-4xl font-bold text-light-text dark:text-dark-text mb-4">
          Oops! Page not found
        </h1>

        <p className="text-lg text-light-text-muted dark:text-dark-text-muted mb-8 leading-relaxed">
          It looks like you've wandered into uncharted territory. The page you're looking for doesn't exist or has been moved. Let's get you back on track!
        </p>

        {/* Illustration - ASCII style */}
        <div className="mb-12 font-mono text-sm text-light-text-muted dark:text-dark-text-muted opacity-50">
          <pre className="inline-block">{`
    ___
   /   \\
  | O_O |
   \\ ~ /
    | | |
   /| | |\\
  / | | | \\
    | | |
`}</pre>
        </div>

        {/* CTA */}
        <Link href="/">
          <Button size="lg" variant="primary">
            Go Home
          </Button>
        </Link>

        {/* Additional Links */}
        <div className="mt-8 space-y-2 text-sm">
          <Link href="/portfolio" className="block text-light-accent dark:text-dark-accent hover:text-light-accent/80 dark:hover:text-dark-accent/80 transition-colors">
            Browse Portfolio
          </Link>
          <Link href="/blog" className="block text-light-accent dark:text-dark-accent hover:text-light-accent/80 dark:hover:text-dark-accent/80 transition-colors">
            Read Blog
          </Link>
          <Link href="/contact" className="block text-light-accent dark:text-dark-accent hover:text-light-accent/80 dark:hover:text-dark-accent/80 transition-colors">
            Get in Touch
          </Link>
        </div>
      </div>
    </div>
  );
}
