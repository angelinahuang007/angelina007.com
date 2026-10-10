import Link from 'next/link';
import { ProjectGrid } from '@/components/portfolio/ProjectGrid';
import { FEATURED_PROJECTS } from '@/lib/content';

export const metadata = {
  title: 'Projects',
};

export default function PortfolioPage() {
  return (
    <div className="min-h-screen py-20 md:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16 space-y-3">
          <h1 className="text-3xl md:text-4xl text-light-text dark:text-dark-text tracking-tight">
            Projects
          </h1>
          <p className="font-sans font-light text-light-text-muted dark:text-dark-text-muted text-base max-w-2xl">
            3D assets, scenes, simulation, and technical problem solving.
          </p>
        </div>

        {FEATURED_PROJECTS.length > 0 ? (
          <ProjectGrid projects={FEATURED_PROJECTS} activeFilter="all" />
        ) : (
          <div className="max-w-2xl py-8 space-y-6">
            <p className="text-lg text-light-text dark:text-dark-text">
              Project case studies are not published yet.
            </p>
            <p className="text-light-text-muted dark:text-dark-text-muted leading-relaxed">
              Have a project in mind? Tell me what you need, your timeline, and the expected deliverables.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center px-7 py-3 rounded-sm bg-light-accent dark:bg-dark-accent text-white font-medium hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              Discuss a project
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
