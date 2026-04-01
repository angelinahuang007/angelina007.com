export type ProjectCategory = 'game-dev' | 'graphics' | 'ml-ai' | 'web' | 'tools';

export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  category: ProjectCategory;
  thumbnail: string;
  heroImage: string;
  techStack: string[];
  date: string;
  status: 'completed' | 'in-progress' | 'archived';
  demoUrl?: string;
  githubUrl?: string;
  blogPostSlug?: string;
  gallery: string[];
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  date: string;
  readingTime: number;
  tags: string[];
  category: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

export interface TimelineEvent {
  year: string;
  title: string;
  description: string;
}

export interface SkillGroup {
  category: string;
  skills: string[];
}
