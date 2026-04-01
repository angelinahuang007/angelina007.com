import { Hero } from '@/components/home/Hero';
import { FeaturedProjects } from '@/components/home/FeaturedProjects';
import { LatestPosts } from '@/components/home/LatestPosts';
import { FEATURED_PROJECTS, BLOG_POSTS } from '@/lib/placeholder-data';

export const metadata = {
  title: 'Home',
};

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedProjects projects={FEATURED_PROJECTS.slice(0, 3)} />
      <LatestPosts posts={BLOG_POSTS.slice(0, 2)} />
    </>
  );
}
