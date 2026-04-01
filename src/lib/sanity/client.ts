/**
 * Sanity CMS Client Configuration
 *
 * TODO: Configure with actual Sanity project credentials:
 * - projectId: Your Sanity project ID
 * - dataset: Your dataset name (usually 'production')
 * - apiVersion: Latest API version
 */

import {
  Project,
  BlogPost,
  Category,
} from '@/types';
import {
  FEATURED_PROJECTS as PLACEHOLDER_PROJECTS,
  BLOG_POSTS as PLACEHOLDER_BLOG_POSTS,
} from '@/lib/placeholder-data';

// TODO: Uncomment and configure with real credentials when Sanity is set up
// import { createClient } from 'next-sanity';
//
// const client = createClient({
//   projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
//   dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
//   apiVersion: '2024-01-01',
//   useCdn: process.env.NODE_ENV === 'production',
// });

/**
 * Get all projects
 * TODO: Replace with actual Sanity query
 * Current: Returns placeholder data
 */
export async function getProjects(): Promise<Project[]> {
  try {
    // TODO: Implement with Sanity GROQ query:
    // const projects = await client.fetch(`
    //   *[_type == "project"] | order(date desc) {
    //     _id,
    //     slug,
    //     title,
    //     description,
    //     longDescription,
    //     category,
    //     thumbnail,
    //     heroImage,
    //     techStack,
    //     date,
    //     status,
    //     demoUrl,
    //     githubUrl,
    //     blogPostSlug,
    //     gallery
    //   }
    // `);
    // return projects;

    // Placeholder: Return mock data
    return PLACEHOLDER_PROJECTS;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return PLACEHOLDER_PROJECTS;
  }
}

/**
 * Get a single project by slug
 * TODO: Replace with actual Sanity query
 * Current: Returns placeholder data
 */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    // TODO: Implement with Sanity GROQ query:
    // const project = await client.fetch(`
    //   *[_type == "project" && slug.current == $slug][0] {
    //     _id,
    //     slug,
    //     title,
    //     description,
    //     longDescription,
    //     category,
    //     thumbnail,
    //     heroImage,
    //     techStack,
    //     date,
    //     status,
    //     demoUrl,
    //     githubUrl,
    //     blogPostSlug,
    //     gallery
    //   }
    // `, { slug });
    // return project;

    // Placeholder: Find in mock data
    return (
      PLACEHOLDER_PROJECTS.find((p) => p.slug === slug) || null
    );
  } catch (error) {
    console.error('Error fetching project:', error);
    return PLACEHOLDER_PROJECTS.find((p) => p.slug === slug) || null;
  }
}

/**
 * Get all blog posts
 * TODO: Replace with actual Sanity query
 * Current: Returns placeholder data
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    // TODO: Implement with Sanity GROQ query:
    // const posts = await client.fetch(`
    //   *[_type == "blogPost"] | order(date desc) {
    //     _id,
    //     slug,
    //     title,
    //     excerpt,
    //     content,
    //     coverImage,
    //     date,
    //     readingTime,
    //     tags,
    //     category
    //   }
    // `);
    // return posts;

    // Placeholder: Return mock data
    return PLACEHOLDER_BLOG_POSTS;
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return PLACEHOLDER_BLOG_POSTS;
  }
}

/**
 * Get a single blog post by slug
 * TODO: Replace with actual Sanity query
 * Current: Returns placeholder data
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    // TODO: Implement with Sanity GROQ query:
    // const post = await client.fetch(`
    //   *[_type == "blogPost" && slug.current == $slug][0] {
    //     _id,
    //     slug,
    //     title,
    //     excerpt,
    //     content,
    //     coverImage,
    //     date,
    //     readingTime,
    //     tags,
    //     category
    //   }
    // `, { slug });
    // return post;

    // Placeholder: Find in mock data
    return (
      PLACEHOLDER_BLOG_POSTS.find((p) => p.slug === slug) || null
    );
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return PLACEHOLDER_BLOG_POSTS.find((p) => p.slug === slug) || null;
  }
}

/**
 * Get all project categories with counts
 * TODO: Replace with actual Sanity query
 * Current: Returns computed categories from placeholder data
 */
export async function getCategories(): Promise<Category[]> {
  try {
    // TODO: Implement with Sanity GROQ query:
    // const categories = await client.fetch(`
    //   *[_type == "category"] {
    //     _id,
    //     name,
    //     slug,
    //     count
    //   }
    // `);
    // return categories;

    // Placeholder: Compute from project data
    const categories: Record<string, Category> = {};

    PLACEHOLDER_PROJECTS.forEach((project) => {
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
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Get projects by category
 * TODO: Replace with actual Sanity query once client is configured
 */
export async function getProjectsByCategory(category: string): Promise<Project[]> {
  try {
    // TODO: Implement with Sanity GROQ query:
    // const projects = await client.fetch(`
    //   *[_type == "project" && category == $category] | order(date desc) {
    //     _id,
    //     slug,
    //     title,
    //     description,
    //     longDescription,
    //     category,
    //     thumbnail,
    //     heroImage,
    //     techStack,
    //     date,
    //     status,
    //     demoUrl,
    //     githubUrl,
    //     blogPostSlug,
    //     gallery
    //   }
    // `, { category });
    // return projects;

    // Placeholder: Filter mock data
    return PLACEHOLDER_PROJECTS.filter((p) => p.category === category);
  } catch (error) {
    console.error('Error fetching projects by category:', error);
    return PLACEHOLDER_PROJECTS.filter((p) => p.category === category);
  }
}

export default {
  getProjects,
  getProjectBySlug,
  getBlogPosts,
  getBlogPostBySlug,
  getCategories,
  getProjectsByCategory,
};
