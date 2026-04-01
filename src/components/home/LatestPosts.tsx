'use client';

import Link from 'next/link';
import { BlogPost } from '@/types';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { formatDate } from '@/lib/utils';

interface LatestPostsProps {
  posts: BlogPost[];
}

export function LatestPosts({ posts }: LatestPostsProps) {
  return (
    <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-light-bg-secondary/50 dark:bg-dark-bg-secondary/20">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          title="Latest Articles"
          subtitle="Thoughts on creative technology, graphics programming, and the intersection of art and code."
          className="mb-16"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {posts.slice(0, 2).map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <Card className="h-full overflow-hidden group cursor-pointer flex flex-col">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>

                <div className="p-6 space-y-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-4">
                    <Tag label={post.category} variant="outline" />
                    <span className="text-xs text-light-text-muted dark:text-dark-text-muted">
                      {post.readingTime} min read
                    </span>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg text-light-text dark:text-dark-text group-hover:text-light-accent dark:group-hover:text-dark-accent transition-colors mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="font-sans font-light text-light-text-muted dark:text-dark-text-muted text-sm line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t border-light-text/5 dark:border-dark-text/5">
                    {post.tags.slice(0, 2).map((tag) => (
                      <Tag key={tag} label={tag} />
                    ))}
                    {post.tags.length > 2 && (
                      <span className="text-xs px-2 py-1 rounded bg-light-bg-secondary dark:bg-dark-bg text-light-text-muted dark:text-dark-text-muted">
                        +{post.tags.length - 2}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-light-text-muted dark:text-dark-text-muted pt-2">
                    {formatDate(post.date, 'short')}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-light-accent dark:text-dark-accent hover:text-light-accent/80 dark:hover:text-dark-accent/80 transition-colors group text-sm"
          >
            Read all articles
            <span className="inline-block transform group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
