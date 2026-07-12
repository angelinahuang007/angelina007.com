import { SocialLink } from '@/types';

export const SITE_METADATA = {
  title: 'Angelina Huang — Computing × Art',
  description: 'A portfolio exploring the intersection of computing and art through interactive projects, graphics programming, machine learning, and creative tools.',
  url: 'https://angelina007.com',
  image: 'https://angelina007.com/og-image.jpg',
  author: 'Angelina Huang',
  email: 'angelina007huang@gmail.com',
};

export const NAVIGATION_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/portfolio', label: 'Projects' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

// 全部为已确认的真实账号（2026-07-12）。ArtStation/Twitter 暂无账号，开通后在此追加。
export const SOCIAL_LINKS: SocialLink[] = [
  {
    platform: 'GitHub',
    url: 'https://github.com/angelinahuang007',
    icon: 'FaGithub',
  },
  {
    platform: 'Bilibili', // 弥也ovo
    url: 'https://space.bilibili.com/12422321',
    icon: 'FaVideo',
  },
  {
    platform: 'YouTube',
    url: 'https://www.youtube.com/@miyeovo',
    icon: 'FaYoutube',
  },
  {
    platform: 'Instagram',
    url: 'https://www.instagram.com/_angelina.007_/',
    icon: 'FaInstagram',
  },
  {
    platform: 'LinkedIn',
    url: 'https://www.linkedin.com/in/xiaolan-angelina-huang/',
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
