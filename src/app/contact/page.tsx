'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiCopy, FiCheck, FiExternalLink } from 'react-icons/fi';
import { SiGithub, SiBilibili, SiYoutube, SiInstagram, SiLinkedin } from 'react-icons/si';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { SOCIAL_LINKS, SITE_METADATA } from '@/lib/constants';

// 2026-07-12: 移除了假的联系表单（原表单仅在前端假装发送成功）。
// 现为诚实版：mailto 按钮 + 复制邮箱 + 真实社交链接。将来需要真表单时再接 Formspree/Resend。

const iconMap: Record<string, React.ReactNode> = {
  GitHub: <SiGithub className="w-6 h-6" />,
  Bilibili: <SiBilibili className="w-6 h-6" />,
  YouTube: <SiYoutube className="w-6 h-6" />,
  Instagram: <SiInstagram className="w-6 h-6" />,
  LinkedIn: <SiLinkedin className="w-6 h-6" />,
};

export default function ContactPage() {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SITE_METADATA.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. non-secure context) — mailto link still works.
    }
  };

  return (
    <div className="min-h-screen py-20 md:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-16">
          <SectionHeading
            title="Get in Touch"
            subtitle="For collaborations, questions about my work, or just to say hi — email is the best way to reach me."
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-12"
        >
          {/* Email card */}
          <div className="p-8 rounded-md bg-light-bg-secondary dark:bg-dark-bg-secondary border border-light-text/10 dark:border-dark-text/10 text-center space-y-6">
            <FiMail className="w-8 h-8 mx-auto text-light-accent dark:text-dark-accent" />
            <p className="font-code text-lg text-light-text dark:text-dark-text break-all">
              {SITE_METADATA.email}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={`mailto:${SITE_METADATA.email}`}>
                <Button size="lg" variant="primary">
                  <FiMail className="w-5 h-5" />
                  Send an Email
                </Button>
              </a>
              <Button size="lg" variant="secondary" onClick={copyEmail}>
                {copied ? <FiCheck className="w-5 h-5" /> : <FiCopy className="w-5 h-5" />}
                {copied ? 'Copied!' : 'Copy Address'}
              </Button>
            </div>
          </div>

          {/* Social links */}
          <div className="text-center space-y-6">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-light-text-muted dark:text-dark-text-muted">
              Elsewhere
            </h2>
            <div className="flex justify-center gap-4">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.platform}
                  className="flex items-center gap-2 px-5 py-3 rounded-md bg-light-bg-secondary dark:bg-dark-bg-secondary border border-light-text/10 dark:border-dark-text/10 text-light-text-muted dark:text-dark-text-muted hover:text-light-accent dark:hover:text-dark-accent hover:-translate-y-0.5 transition-all"
                >
                  {iconMap[social.platform] ?? <FiExternalLink className="w-6 h-6" />}
                  <span className="text-sm">{social.platform}</span>
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
