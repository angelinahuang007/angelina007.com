'use client';

import { ProjectCategory } from '@/types';
import { motion } from 'framer-motion';

interface FilterBarProps {
  activeFilter: ProjectCategory | 'all';
  onFilterChange: (category: ProjectCategory | 'all') => void;
}

const categories: Array<{ id: ProjectCategory | 'all'; label: string }> = [
  { id: 'all', label: 'All Projects' },
  { id: 'game-dev', label: 'Game Dev' },
  { id: 'graphics', label: 'Graphics' },
  { id: 'ml-ai', label: 'ML/AI' },
  { id: 'web', label: 'Web' },
  { id: 'tools', label: 'Tools' },
];

export function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
  return (
    <div className="flex overflow-x-auto pb-4 -mx-4 px-4 md:overflow-visible md:mx-0 md:px-0 gap-3 md:gap-4 mb-12">
      {categories.map((category) => (
        <motion.button
          key={category.id}
          onClick={() => onFilterChange(category.id)}
          className="relative whitespace-nowrap px-4 py-2 rounded-sm font-medium text-sm transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span
            className={`relative z-10 ${
              activeFilter === category.id
                ? 'text-white dark:text-white'
                : 'text-light-text-muted dark:text-dark-text-muted hover:text-light-text dark:hover:text-dark-text'
            } transition-colors`}
          >
            {category.label}
          </span>
          {activeFilter === category.id && (
            <motion.div
              layoutId="activeFilter"
              className="absolute inset-0 rounded-sm bg-light-accent dark:bg-dark-accent -z-0"
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}
