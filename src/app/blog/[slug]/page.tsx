import { notFound } from 'next/navigation';
import { PostDetail } from '@/components/blog/PostDetail';
import { BLOG_POSTS } from '@/lib/content';

export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

interface BlogPageProps {
  params: { slug: string };
}

export default function BlogPage({ params }: BlogPageProps) {
  const post = BLOG_POSTS.find((item) => item.slug === params.slug);

  if (!post) {
    notFound();
  }

  return <PostDetail post={post} />;
}
