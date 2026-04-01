import { SectionHeading } from '@/components/ui/SectionHeading';
import { PostList } from '@/components/blog/PostList';
import { BLOG_POSTS } from '@/lib/placeholder-data';

export const metadata = {
  title: 'Blog',
};

export default function BlogPage() {
  return (
    <div className="min-h-screen py-20 md:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <SectionHeading
            title="Articles"
            subtitle="Thoughts on creative technology, graphics programming, game development, and the intersection of art and code."
          />
        </div>

        {/* Post List */}
        <PostList posts={BLOG_POSTS} />
      </div>
    </div>
  );
}
