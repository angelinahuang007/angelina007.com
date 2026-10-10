'use client';

import Link from 'next/link';
import { Project } from '@/types';
import { ProjectCard } from '@/components/portfolio/ProjectCard';
import { SectionHeading } from '@/components/ui/SectionHeading';

interface FeaturedProjectsProps {
  projects: Project[];
}

export function FeaturedProjects({ projects }: FeaturedProjectsProps) {
  if (projects.length === 0) return null;

  return (
    <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          title="Featured Work"
          subtitle="A selection of projects at the intersection of computing and art."
          className="mb-16"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 text-light-accent dark:text-dark-accent-light hover:text-light-accent/80 dark:hover:text-dark-accent/80 transition-colors group text-sm"
          >
            View all projects
            <span className="inline-block transform group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
