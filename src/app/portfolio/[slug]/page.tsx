'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiGithub, FiExternalLink, FiDownload } from 'react-icons/fi';
import { FEATURED_PROJECTS, BLOG_POSTS } from '@/lib/placeholder-data';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { formatDate } from '@/lib/utils';

interface ProjectPageProps {
  params: {
    slug: string;
  };
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const project = FEATURED_PROJECTS.find((p) => p.slug === params.slug);
  const relatedPost = project?.blogPostSlug
    ? BLOG_POSTS.find((p) => p.slug === project.blogPostSlug)
    : null;

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-light-text dark:text-dark-text mb-4">
            Project not found
          </h1>
          <p className="text-light-text-muted dark:text-dark-text-muted mb-8">
            The project you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/portfolio">
            <Button>Back to Portfolio</Button>
          </Link>
        </div>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    'ml-ai': 'bg-blue-500',
    'graphics': 'bg-pink-500',
    'game-dev': 'bg-green-500',
    'web': 'bg-yellow-500',
    'tools': 'bg-light-accent',
  };

  const getCategoryColor = (category: string) => {
    return categoryColors[category] || 'bg-light-accent';
  };

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link href="/portfolio" className="inline-flex items-center gap-2 text-light-accent dark:text-dark-accent hover:text-light-accent/80 dark:hover:text-dark-accent/80 mb-8 group">
          <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Portfolio
        </Link>

        {/* Hero Image */}
        <motion.div
          className={`relative h-96 rounded-md overflow-hidden mb-12 ${
            getCategoryColor(project.category)
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img
            src={project.heroImage}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Header */}
        <motion.div
          className="mb-12 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-light-text dark:text-dark-text mb-4">
                {project.title}
              </h1>
              <p className="text-light-text-muted dark:text-dark-text-muted text-lg mb-4">
                {project.date && formatDate(project.date)} · {project.status}
              </p>
            </div>
            <Tag label={project.category.replace('-', ' ')} />
          </div>

          {/* Description */}
          <p className="text-lg text-light-text-muted dark:text-dark-text-muted leading-relaxed">
            {project.longDescription}
          </p>
        </motion.div>

        {/* Tech Stack */}
        <motion.div
          className="mb-12 p-8 rounded-md bg-light-bg-secondary dark:bg-dark-bg-secondary border border-light-text/10 dark:border-dark-text/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-bold text-light-text dark:text-dark-text mb-4">
            Tech Stack
          </h2>
          <div className="flex flex-wrap gap-3">
            {project.techStack.map((tech) => (
              <Tag key={tech} label={tech} variant="outline" />
            ))}
          </div>
        </motion.div>

        {/* Links */}
        <motion.div
          className="mb-16 flex flex-wrap gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {project.demoUrl && (
            <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="primary" size="lg">
                <FiExternalLink className="w-5 h-5" />
                Visit Demo
              </Button>
            </a>
          )}
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="lg">
                <FiGithub className="w-5 h-5" />
                View Code
              </Button>
            </a>
          )}
          <a href="/files/resume.pdf" download>
            <Button variant="ghost" size="lg">
              <FiDownload className="w-5 h-5" />
              Download Resume
            </Button>
          </a>
        </motion.div>

        {/* Gallery */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-light-text dark:text-dark-text mb-6">
            Gallery
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {project.gallery.map((image, idx) => (
              <div
                key={idx}
                className="relative h-64 rounded-sm overflow-hidden bg-light-accent dark:bg-dark-accent/50 hover:shadow-lg transition-shadow"
              >
                <img
                  src={image}
                  alt={`${project.title} gallery ${idx + 1}`}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Related Blog Post */}
        {relatedPost && (
          <motion.div
            className="p-8 rounded-md bg-light-bg-secondary dark:bg-dark-bg-secondary border border-light-text/10 dark:border-dark-text/10 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-lg font-bold text-light-text dark:text-dark-text mb-2">
              Related Article
            </h3>
            <Link href={`/blog/${relatedPost.slug}`} className="group">
              <h4 className="text-xl font-semibold text-light-accent dark:text-dark-accent group-hover:text-light-accent/80 dark:group-hover:text-dark-accent/80 transition-colors mb-2">
                {relatedPost.title}
              </h4>
              <p className="text-light-text-muted dark:text-dark-text-muted">
                {relatedPost.excerpt}
              </p>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
