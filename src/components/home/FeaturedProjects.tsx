'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiGithub, FiExternalLink } from 'react-icons/fi';
import { Project } from '@/types';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { CATEGORY_COLORS } from '@/lib/constants';

interface FeaturedProjectsProps {
  projects: Project[];
}

export function FeaturedProjects({ projects }: FeaturedProjectsProps) {
  const router = useRouter();

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
            <div key={project.id} onClick={() => router.push(`/portfolio/${project.slug}`)} role="link" tabIndex={0}>
              <Card className="h-full overflow-hidden group cursor-pointer">
                <div className={`relative h-48 ${CATEGORY_COLORS[project.category] || 'bg-light-accent'} overflow-hidden`}>
                  <img
                    src={project.thumbnail}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg text-light-text dark:text-dark-text group-hover:text-light-accent dark:group-hover:text-dark-accent transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-sm text-light-text-muted dark:text-dark-text-muted mt-1">
                        {project.date.split('-')[0]}
                      </p>
                    </div>
                    <Tag label={project.category.replace('-', ' ')} />
                  </div>

                  <p className="font-sans font-light text-light-text-muted dark:text-dark-text-muted text-sm line-clamp-2">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {project.techStack.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="text-xs px-2 py-1 rounded bg-light-bg-secondary dark:bg-dark-bg text-light-text-muted dark:text-dark-text-muted"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.techStack.length > 3 && (
                      <span className="text-xs px-2 py-1 rounded bg-light-bg-secondary dark:bg-dark-bg text-light-text-muted dark:text-dark-text-muted">
                        +{project.techStack.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-light-text/5 dark:border-dark-text/5">
                    {project.demoUrl && (
                      <a
                        href={project.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 text-sm text-light-accent dark:text-dark-accent hover:text-light-accent/80 dark:hover:text-dark-accent/80 transition-colors"
                      >
                        <FiExternalLink className="w-4 h-4" />
                        Demo
                      </a>
                    )}
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 text-sm text-light-accent dark:text-dark-accent hover:text-light-accent/80 dark:hover:text-dark-accent/80 transition-colors"
                      >
                        <FiGithub className="w-4 h-4" />
                        Code
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 text-light-accent dark:text-dark-accent hover:text-light-accent/80 dark:hover:text-dark-accent/80 transition-colors group text-sm"
          >
            View all projects
            <span className="inline-block transform group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
