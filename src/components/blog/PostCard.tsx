'use client';

import Link from 'next/link';
import { BlogPost } from '@/types';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { formatDate } from '@/lib/utils';

interface PostCardProps {
  post: BlogPost;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <Card className="overflow-hidden group h-full cursor-pointer hover:shadow-xl transition-shadow">
        <div className="flex flex-col md:flex-row h-full">
          {/* Cover Image */}
          <div className="relative w-full md:w-48 h-48 md:h-auto overflow-hidden flex-shrink-0">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col justify-between flex-1">
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Tag label={post.category} variant="outline" />
                <span className="text-xs text-light-text-muted dark:text-dark-text-muted">
                  {post.readingTime} min read
                </span>
                <span className="text-xs text-light-text-muted dark:text-dark-text-muted">
                  {formatDate(post.date, 'short')}
                </span>
              </div>

              <h3 className="text-xl font-bold text-light-text dark:text-dark-text group-hover:text-light-accent dark:group-hover:text-dark-accent transition-colors line-clamp-2">
                {post.title}
              </h3>

              <p className="text-light-text-muted dark:text-dark-text-muted text-sm line-clamp-2">
                {post.excerpt}
              </p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-light-text/10 dark:border-dark-text/10">
              {post.tags.slice(0, 3).map((tag) => (
                <Tag key={tag} label={tag} />
              ))}
              {post.tags.length > 3 && (
                <span className="text-xs px-2 py-1 rounded bg-light-bg-secondary dark:bg-dark-bg text-light-text-muted dark:text-dark-text-muted">
                  +{post.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
