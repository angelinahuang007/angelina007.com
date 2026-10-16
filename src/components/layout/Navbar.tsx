'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { FiMenu, FiX } from 'react-icons/fi';
import { NAVIGATION_LINKS } from '@/lib/constants';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const lastScrollY = useRef(0);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [navVisible, setNavVisible] = useState(true);
  const [sceneVisible, setSceneVisible] = useState(pathname === '/');
  const overScene = pathname === '/' && sceneVisible;

  useEffect(() => {
    const updateSceneVisibility = () => {
      const hero = document.querySelector('[data-room-hero]');
      const bounds = hero?.getBoundingClientRect();
      setSceneVisible(pathname === '/' && Boolean(bounds && bounds.bottom > 64 && bounds.top < 64));
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      updateSceneVisibility();

      if (currentScrollY < 50) {
        setNavVisible(true);
        setScrolling(false);
      } else if (currentScrollY > lastScrollY.current) {
        setScrolling(true);
        setNavVisible(false);
      } else {
        setScrolling(true);
        setNavVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateSceneVisibility, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateSceneVisibility);
    };
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out',
        'focus-within:translate-y-0',
        navVisible || mobileMenuOpen ? 'translate-y-0' : '-translate-y-full',
        overScene || !scrolling
          ? 'bg-transparent'
          : 'glass border-b border-light-text/5 dark:border-dark-text/5'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Logo */}
          <Link
            href="/"
            aria-label="Angelina Huang home"
            className={cn(
              'text-2xl font-light tracking-widest hover:opacity-80 transition-opacity',
              overScene
                ? 'text-white [text-shadow:0_1px_5px_rgba(0,0,0,0.5)]'
                : 'text-light-accent dark:text-dark-accent'
            )}
          >
            A.
          </Link>

          <div className="flex-1" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 mr-2">
            {NAVIGATION_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 text-sm transition-colors',
                  overScene
                    ? 'text-white hover:text-white/75 [text-shadow:0_1px_5px_rgba(0,0,0,0.5)]'
                    : 'text-light-text-muted dark:text-dark-text-muted hover:text-light-text dark:hover:text-dark-text hover:bg-light-text/5 dark:hover:bg-dark-text/5'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Theme Toggle & Mobile Menu */}
          <div className="flex items-center space-x-2">
            <ThemeToggle onScene={overScene} />

            <button
              ref={menuButton}
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn(
                'md:hidden p-2 transition-colors',
                overScene
                  ? 'text-white hover:text-white/75 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]'
                  : 'text-light-text dark:text-dark-text hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary'
              )}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              aria-controls={mobileMenuOpen ? 'mobile-navigation' : undefined}
            >
              {mobileMenuOpen ? (
                <FiX className="w-6 h-6" />
              ) : (
                <FiMenu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-navigation"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-light-text/5 dark:border-dark-text/5 bg-light-bg dark:bg-dark-bg-secondary"
          >
            <div className="px-4 py-4 space-y-1">
              {NAVIGATION_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 hover:bg-light-text/5 dark:hover:bg-dark-text/5 transition-colors text-light-text dark:text-dark-text text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
