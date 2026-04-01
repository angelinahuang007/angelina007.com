'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Heading {
  id: string;
  text: string;
  level: number;
}

const headings: Heading[] = [
  { id: 'introduction', text: 'Introduction', level: 2 },
  { id: 'main-concept', text: 'Main Concept', level: 2 },
  { id: 'implementation', text: 'Implementation', level: 2 },
  { id: 'results', text: 'Results', level: 2 },
  { id: 'conclusion', text: 'Conclusion', level: 2 },
];

export function TableOfContents() {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      const headingElements = headings.map((h) => {
        const el = document.getElementById(h.id);
        return { id: h.id, element: el, top: el?.getBoundingClientRect().top ?? 0 };
      });

      const visibleHeadings = headingElements
        .filter((h) => h.top >= 0 && h.top <= 300)
        .sort((a, b) => a.top - b.top);

      if (visibleHeadings.length > 0) {
        setActiveId(visibleHeadings[0].id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      className="sticky top-32 space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h3 className="font-semibold text-light-text dark:text-dark-text">
        Table of Contents
      </h3>
      <nav className="space-y-2">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={`block text-sm transition-colors py-1 ${
              activeId === heading.id
                ? 'text-light-accent dark:text-dark-accent font-medium'
                : 'text-light-text-muted dark:text-dark-text-muted hover:text-light-text dark:hover:text-dark-text'
            }`}
            style={{
              paddingLeft: `${(heading.level - 2) * 12}px`,
            }}
          >
            {activeId === heading.id && (
              <motion.span
                layoutId="activeIndicator"
                className="inline-block w-1 h-1 rounded bg-light-accent dark:bg-dark-accent mr-2"
                transition={{ type: 'spring', damping: 20 }}
              />
            )}
            {heading.text}
          </a>
        ))}
      </nav>
    </motion.div>
  );
}
