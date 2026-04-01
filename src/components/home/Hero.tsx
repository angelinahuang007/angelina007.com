'use client';

import Link from 'next/link';
import { FiArrowDown } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { CosmicBackground } from './CosmicBackground';

export function Hero() {
  return (
    <section className="relative min-h-screen -mt-16 pt-16 flex items-center justify-center overflow-hidden">
      <CosmicBackground />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Greeting */}
        <p className="text-light-accent dark:text-dark-accent text-xs tracking-widest uppercase mb-8">
          Welcome to my creative space
        </p>

        {/* Main Title - Monoton display font */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-light-text dark:text-dark-text">
          Angelina Huang
        </h1>

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-light-text-muted dark:text-dark-text-muted mb-8 tracking-wide">
          Computing{' '}
          <span className="text-light-accent dark:text-dark-accent">×</span>{' '}
          Art
        </p>

        {/* Description */}
        <p className="font-sans font-light text-sm text-light-text-muted dark:text-dark-text-muted max-w-xl mx-auto mb-12 leading-relaxed">
          A creative technologist exploring the intersection of code and artistic expression.
          From machine learning and graphics programming to interactive experiences.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/portfolio">
            <Button size="lg" variant="primary">
              View Portfolio
            </Button>
          </Link>
          <Link href="/blog">
            <Button size="lg" variant="secondary">
              Read Blog
            </Button>
          </Link>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <FiArrowDown className="w-4 h-4 text-light-text-muted/40 dark:text-dark-text-muted/40" />
      </div>
    </section>
  );
}
