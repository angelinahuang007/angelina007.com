import Link from 'next/link';
import { NAVIGATION_LINKS, SOCIAL_LINKS, SITE_METADATA } from '@/lib/constants';
import { FiGithub, FiMail, FiExternalLink } from 'react-icons/fi';
import { SiBilibili, SiYoutube, SiInstagram, SiArtstation, SiTwitter, SiLinkedin } from 'react-icons/si';

const iconMap: Record<string, React.ReactNode> = {
  GitHub: <FiGithub className="w-5 h-5" />,
  Bilibili: <SiBilibili className="w-5 h-5" />,
  YouTube: <SiYoutube className="w-5 h-5" />,
  Instagram: <SiInstagram className="w-5 h-5" />,
  ArtStation: <SiArtstation className="w-5 h-5" />,
  Twitter: <SiTwitter className="w-5 h-5" />,
  LinkedIn: <SiLinkedin className="w-5 h-5" />,
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-light-text/8 dark:border-dark-text/8 bg-light-bg-secondary/50 dark:bg-dark-bg-secondary/30 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="text-2xl font-light tracking-widest text-light-accent dark:text-dark-accent">
              A.
            </div>
            <p className="font-sans font-light text-sm text-light-text-muted dark:text-dark-text-muted">
              Creative technologist exploring the intersection of computing and art.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-light-text dark:text-dark-text text-sm tracking-wide uppercase">Navigation</h3>
            <ul className="space-y-2">
              {NAVIGATION_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-light-text-muted dark:text-dark-text-muted hover:text-light-text dark:hover:text-dark-text transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-light-text dark:text-dark-text text-sm tracking-wide uppercase">Connect</h3>
            <div className="flex flex-wrap gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-light-text-muted dark:text-dark-text-muted hover:text-light-accent dark:hover:text-dark-accent transition-colors"
                  aria-label={social.platform}
                >
                  {iconMap[social.platform] || <FiExternalLink className="w-5 h-5" />}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-light-text/8 dark:border-dark-text/8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-light-text-muted dark:text-dark-text-muted">
            <p>
              &copy; {currentYear} {SITE_METADATA.author}. All rights reserved.
            </p>
            <p>
              Built with Next.js, Tailwind CSS, and Framer Motion.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
