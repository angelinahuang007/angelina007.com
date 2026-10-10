'use client';

import Link from 'next/link';
import { FiArrowDown } from 'react-icons/fi';
import { CosmicBackground } from './CosmicBackground';

export function Hero() {
  return (
    <section className="relative isolate min-h-[min(760px,100svh)] -mt-16 pt-32 pb-28 flex items-center justify-center overflow-hidden">
      <CosmicBackground />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-light-accent dark:text-dark-accent-light text-xs tracking-widest uppercase mb-8">
          3D Design · Simulation · Creative Technology
        </p>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-light-text dark:text-dark-text">
          Angelina Huang
        </h1>

        <p className="text-xl md:text-2xl text-light-text-muted dark:text-dark-text-muted mb-8 tracking-wide">
          Computing{' '}
          <span className="text-light-accent dark:text-dark-accent-light">×</span>{' '}
          Art
        </p>

        <p className="font-sans text-base text-light-text-muted dark:text-dark-text-muted max-w-xl mx-auto mb-10 leading-relaxed">
          I build 3D assets, scenes, and interactive experiences, with hands-on work
          in embodied AI training and simulation.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/contact" className="inline-flex items-center justify-center rounded-sm px-7 py-3 text-sm bg-light-accent dark:bg-dark-accent text-white hover:opacity-90 transition-opacity">
            Discuss a project
          </Link>
          <a href="#services" className="inline-flex items-center justify-center rounded-sm px-7 py-3 text-sm border border-light-accent/40 dark:border-dark-accent/40 text-light-accent dark:text-dark-accent-light hover:bg-light-accent/10 dark:hover:bg-dark-accent/10 transition-colors">
            Explore what I do
          </a>
        </div>
      </div>

      <a href="#services" aria-label="Explore services" className="absolute bottom-8 left-1/2 -translate-x-1/2 p-3 motion-safe:animate-bounce">
        <FiArrowDown className="w-4 h-4 text-light-text-muted/40 dark:text-dark-text-muted/40" />
      </a>
    </section>
  );
}
