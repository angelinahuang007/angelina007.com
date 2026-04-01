'use client';

import { useRouter } from 'next/navigation';
import { Project } from '@/types';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { FiGithub, FiExternalLink } from 'react-icons/fi';
import { CATEGORY_COLORS } from '@/lib/constants';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();

  return (
    <div onClick={() => router.push(`/portfolio/${project.slug}`)} role="link" tabIndex={0}>
      <Card className="h-full overflow-hidden group cursor-pointer">
        {/* Thumbnail */}
        <div className={`relative h-48 ${CATEGORY_COLORS[project.category] || 'bg-light-accent'} overflow-hidden`}>
          <img
            src={project.thumbnail}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-light-text dark:text-dark-text group-hover:text-light-accent dark:group-hover:text-dark-accent transition-colors">
                {project.title}
              </h3>
              <p className="text-sm text-light-text-muted dark:text-dark-text-muted mt-1">
                {project.date.split('-')[0]}
              </p>
            </div>
            <Tag label={project.category.replace('-', ' ')} />
          </div>

          <p className="text-light-text-muted dark:text-dark-text-muted text-sm line-clamp-2">
            {project.description}
          </p>

          {/* Tech Stack */}
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

          {/* Links */}
          <div className="flex gap-4 pt-4 border-t border-light-text/10 dark:border-dark-text/10">
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
  );
}
