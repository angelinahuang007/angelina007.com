import { SocialLink } from '@/types';

export const SITE_METADATA = {
  title: 'Angelina Huang — Computing × Art',
  description: 'A portfolio exploring the intersection of computing and art through interactive projects, graphics programming, machine learning, and creative tools.',
  url: 'https://angelina007.com',
  image: 'https://angelina007.com/og-image.jpg',
  author: 'Angelina Huang',
  email: 'contact@angelina007.com',
};

export const NAVIGATION_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export const SOCIAL_LINKS: SocialLink[] = [
  {
    platform: 'GitHub',
    url: 'https://github.com/angelina007',
    icon: 'FaGithub',
  },
  {
    platform: 'Bilibili',
    url: 'https://www.bilibili.com/angelina007',
    icon: 'FaVideo',
  },
  {
    platform: 'YouTube',
    url: 'https://www.youtube.com/@angelina007',
    icon: 'FaYoutube',
  },
  {
    platform: 'Instagram',
    url: 'https://instagram.com/angelina007',
    icon: 'FaInstagram',
  },
  {
    platform: 'ArtStation',
    url: 'https://www.artstation.com/angelina007',
    icon: 'FaArtstation',
  },
  {
    platform: 'Twitter',
    url: 'https://twitter.com/angelina007',
    icon: 'FaTwitter',
  },
  {
    platform: 'LinkedIn',
    url: 'https://linkedin.com/in/angelina007',
    icon: 'FaLinkedin',
  },
];

export const CATEGORY_COLORS: Record<string, string> = {
  'ml-ai': 'bg-sky-600',
  'graphics': 'bg-purple-600',
  'game-dev': 'bg-emerald-600',
  'web': 'bg-amber-600',
  'tools': 'bg-light-accent',
};
