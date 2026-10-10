import { notFound } from 'next/navigation';
import { ProjectDetail } from '@/components/portfolio/ProjectDetail';
import { FEATURED_PROJECTS, BLOG_POSTS } from '@/lib/content';

export const dynamicParams = false;

export function generateStaticParams() {
  return FEATURED_PROJECTS.map((project) => ({ slug: project.slug }));
}

interface ProjectPageProps {
  params: { slug: string };
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const project = FEATURED_PROJECTS.find((item) => item.slug === params.slug);

  if (!project) {
    notFound();
  }

  const relatedPost = BLOG_POSTS.find((post) => post.slug === project.blogPostSlug);
  return <ProjectDetail project={project} relatedPost={relatedPost} />;
}
