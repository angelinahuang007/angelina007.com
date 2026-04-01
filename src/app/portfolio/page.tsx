'use client';

import { useState } from 'react';
import { ProjectCategory } from '@/types';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { FilterBar } from '@/components/portfolio/FilterBar';
import { ProjectGrid } from '@/components/portfolio/ProjectGrid';
import { FEATURED_PROJECTS } from '@/lib/placeholder-data';

export default function PortfolioPage() {
  const [activeFilter, setActiveFilter] = useState<ProjectCategory | 'all'>('all');

  return (
    <div className="min-h-screen py-20 md:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <SectionHeading
            title="Portfolio"
            subtitle="A collection of projects exploring the intersection of computing and art, from machine learning and graphics programming to interactive experiences and game development."
          />
        </div>

        {/* Filter Bar */}
        <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

        {/* Projects Grid */}
        <ProjectGrid projects={FEATURED_PROJECTS} activeFilter={activeFilter} />

        {/* Empty State */}
        {FEATURED_PROJECTS.filter(
          (p) => activeFilter === 'all' || p.category === activeFilter
        ).length === 0 && (
          <div className="text-center py-20">
            <p className="text-light-text-muted dark:text-dark-text-muted text-lg">
              No projects found in this category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
