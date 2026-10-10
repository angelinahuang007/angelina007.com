import type { Project, BlogPost, Category } from '@/types';
import { FEATURED_PROJECTS, BLOG_POSTS } from '@/lib/content';

// Until a CMS is configured, read only the owner's verified public content.
export async function getProjects(): Promise<Project[]> {
  return FEATURED_PROJECTS;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  return FEATURED_PROJECTS.find((project) => project.slug === slug) ?? null;
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  return BLOG_POSTS;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  return BLOG_POSTS.find((post) => post.slug === slug) ?? null;
}

export async function getCategories(): Promise<Category[]> {
  const categories: Record<string, Category> = {};

  FEATURED_PROJECTS.forEach((project) => {
    if (!categories[project.category]) {
      categories[project.category] = {
        id: project.category,
        name: project.category
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        slug: project.category,
        count: 0,
      };
    }
    categories[project.category].count += 1;
  });

  return Object.values(categories);
}

export async function getProjectsByCategory(category: string): Promise<Project[]> {
  return FEATURED_PROJECTS.filter((project) => project.category === category);
}

export default {
  getProjects,
  getProjectBySlug,
  getBlogPosts,
  getBlogPostBySlug,
  getCategories,
  getProjectsByCategory,
};
