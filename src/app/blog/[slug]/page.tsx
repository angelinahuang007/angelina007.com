'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiShare2 } from 'react-icons/fi';
import { BLOG_POSTS } from '@/lib/placeholder-data';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { formatDate, calculateReadingTime } from '@/lib/utils';

interface BlogPageProps {
  params: {
    slug: string;
  };
}

export default function BlogPage({ params }: BlogPageProps) {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-light-text dark:text-dark-text mb-4">
            Article not found
          </h1>
          <p className="text-light-text-muted dark:text-dark-text-muted mb-8">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  const contentSections = post.content.split('\n\n').filter((s) => s.trim());
  const readingTime = calculateReadingTime(post.content);

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      {/* Container with Sidebar */}
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link href="/blog" className="inline-flex items-center gap-2 text-light-accent dark:text-dark-accent hover:text-light-accent/80 dark:hover:text-dark-accent/80 mb-8 group">
          <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Blog
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Main Content */}
          <motion.div
            className="lg:col-span-3 space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Cover Image */}
            <div className="relative h-96 rounded-md overflow-hidden">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Header */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-light-text dark:text-dark-text leading-tight">
                {post.title}
              </h1>

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 text-light-text-muted dark:text-dark-text-muted">
                <time dateTime={post.date}>
                  {formatDate(post.date, 'long')}
                </time>
                <span>·</span>
                <span>{readingTime} min read</span>
                <span>·</span>
                <Tag label={post.category} variant="outline" />
              </div>
            </div>

            {/* Article Content */}
            <article className="prose dark:prose-invert max-w-none space-y-6">
              {contentSections.map((section, idx) => {
                const lines = section.split('\n');
                const firstLine = lines[0];
                const isHeading = firstLine.endsWith(':');

                if (isHeading) {
                  const headingText = firstLine.replace(':', '');
                  const slug = headingText
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^\w-]/g, '');

                  return (
                    <div key={idx} id={slug} className="scroll-mt-20">
                      <h2 className="text-2xl md:text-3xl font-bold text-light-text dark:text-dark-text mb-4">
                        {headingText}
                      </h2>
                      {lines.length > 1 && (
                        <div className="space-y-4">
                          {lines.slice(1).map((line, lineIdx) => (
                            line.trim() && (
                              <p
                                key={lineIdx}
                                className="text-light-text-muted dark:text-dark-text-muted leading-relaxed"
                              >
                                {line}
                              </p>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <p
                    key={idx}
                    className="text-light-text-muted dark:text-dark-text-muted leading-relaxed text-lg"
                  >
                    {section}
                  </p>
                );
              })}
            </article>

            {/* Tags */}
            <div className="pt-8 border-t border-light-text/10 dark:border-dark-text/10">
              <h3 className="text-sm font-semibold text-light-text dark:text-dark-text mb-3">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Tag key={tag} label={tag} />
                ))}
              </div>
            </div>

            {/* Share Section */}
            <div className="pt-8 border-t border-light-text/10 dark:border-dark-text/10">
              <h3 className="text-sm font-semibold text-light-text dark:text-dark-text mb-4">
                Share this article
              </h3>
              <div className="flex gap-4">
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(post.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-light-bg-secondary dark:bg-dark-bg text-light-text dark:text-dark-text hover:bg-light-accent/10 dark:hover:bg-dark-accent/10 transition-colors"
                >
                  <FiShare2 className="w-4 h-4" />
                  Twitter
                </a>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: post.title,
                        text: post.excerpt,
                        url: typeof window !== 'undefined' ? window.location.href : '',
                      });
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-light-bg-secondary dark:bg-dark-bg text-light-text dark:text-dark-text hover:bg-light-accent/10 dark:hover:bg-dark-accent/10 transition-colors"
                >
                  <FiShare2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>
          </motion.div>

          {/* Sidebar - Table of Contents */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <TableOfContents />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
