import Link from 'next/link';
import { PostList } from '@/components/blog/PostList';
import { BLOG_POSTS } from '@/lib/content';

export const metadata = {
  title: 'Blog',
};

export default function BlogPage() {
  return (
    <div className="min-h-screen py-20 md:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-3xl md:text-4xl text-light-text dark:text-dark-text tracking-tight">
            Articles
          </h1>
        </div>

        {/* Post List */}
        {BLOG_POSTS.length > 0 ? (
          <PostList posts={BLOG_POSTS} />
        ) : (
          <div className="max-w-2xl py-8 space-y-6">
            <p className="text-lg text-light-text dark:text-dark-text">
              Articles are not published yet.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center text-light-accent dark:text-dark-accent-light underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              Get in touch about a project
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
