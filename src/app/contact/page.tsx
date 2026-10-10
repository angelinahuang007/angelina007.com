'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiCopy, FiCheck, FiExternalLink } from 'react-icons/fi';
import { SiGithub, SiBilibili, SiYoutube, SiInstagram, SiLinkedin } from 'react-icons/si';
import { Button } from '@/components/ui/Button';
import { SOCIAL_LINKS, SITE_METADATA } from '@/lib/constants';

const iconMap: Record<string, React.ReactNode> = {
  GitHub: <SiGithub aria-hidden="true" className="w-6 h-6" />,
  Bilibili: <SiBilibili aria-hidden="true" className="w-6 h-6" />,
  YouTube: <SiYoutube aria-hidden="true" className="w-6 h-6" />,
  Instagram: <SiInstagram aria-hidden="true" className="w-6 h-6" />,
  LinkedIn: <SiLinkedin aria-hidden="true" className="w-6 h-6" />,
};

const inquiryDetails = [
  { title: 'Goal', description: 'What are you building, and what should it do?' },
  { title: 'Existing assets or environment', description: 'What models, scenes, references, or setup are you starting with?' },
  { title: 'Deliverables', description: 'What do you need back, including any file or platform requirements?' },
  { title: 'Timing', description: 'Your target date and any important milestones.' },
];

const projectEmail = `mailto:${SITE_METADATA.email}?subject=${encodeURIComponent('Project inquiry')}&body=${encodeURIComponent('Hi Angelina,\n\nProject goal:\n\nExisting assets or environment:\n\nDeliverables and requirements:\n\nTiming:\n\nThanks,\n')}`;
const focusStyles =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-accent dark:focus-visible:ring-dark-accent focus-visible:ring-offset-4 focus-visible:ring-offset-light-bg dark:focus-visible:ring-offset-dark-bg';

type CopyStatus = 'idle' | 'copying' | 'copied' | 'error';

export default function ContactPage() {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');

  const copyEmail = async () => {
    setCopyStatus('copying');
    try {
      await navigator.clipboard.writeText(SITE_METADATA.email);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('error');
    }
  };

  return (
    <div className="min-h-screen py-20 md:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto min-w-0">
        <div className="mb-12 space-y-3">
          <h1 className="text-3xl md:text-4xl text-light-text dark:text-dark-text tracking-tight">
            Get in Touch
          </h1>
          <p className="font-sans font-light text-light-text-muted dark:text-dark-text-muted text-base">
            For 3D, simulation, and design projects, collaborations, or questions
            about my work — email is the best way to reach me.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-12"
        >
          <section aria-label="Email Angelina" className="min-w-0 p-6 sm:p-8 rounded-md bg-light-bg-secondary dark:bg-dark-bg-secondary border border-light-text/10 dark:border-dark-text/10 text-center">
            <FiMail aria-hidden="true" className="w-8 h-8 mx-auto text-light-accent dark:text-dark-accent-light mb-6" />
            <a
              href={`mailto:${SITE_METADATA.email}`}
              className={`inline-block max-w-full font-code text-sm sm:text-lg text-light-text dark:text-dark-text break-all select-text underline underline-offset-4 rounded-sm ${focusStyles}`}
            >
              {SITE_METADATA.email}
            </a>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center mt-6">
              <a
                href={projectEmail}
                className={`inline-flex items-center justify-center gap-2 px-7 py-3 rounded-sm bg-light-accent dark:bg-dark-accent text-white font-medium hover:bg-light-accent/90 dark:hover:bg-dark-accent/90 transition-colors ${focusStyles}`}
              >
                <FiMail aria-hidden="true" className="w-5 h-5 shrink-0" />
                Send an Email
              </a>
              <Button
                type="button"
                size="lg"
                variant="secondary"
                onClick={copyEmail}
                disabled={copyStatus === 'copying'}
                aria-busy={copyStatus === 'copying'}
                className={focusStyles}
              >
                {copyStatus === 'copied' ? <FiCheck aria-hidden="true" className="w-5 h-5" /> : <FiCopy aria-hidden="true" className="w-5 h-5" />}
                {copyStatus === 'copied' ? 'Copied!' : copyStatus === 'copying' ? 'Copying…' : 'Copy Address'}
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-light-text-muted dark:text-dark-text-muted mt-4">
              Opens a short project brief in your email app for you to edit and send.
            </p>
            <p role="status" aria-live="polite" className="min-h-[1.5rem] text-sm leading-relaxed text-light-text-muted dark:text-dark-text-muted mt-3">
              {copyStatus === 'copied' && 'Email address copied.'}
              {copyStatus === 'error' && 'Couldn’t copy automatically. Select the address above to copy it, or use the email link.'}
            </p>
          </section>

          <section aria-labelledby="inquiry-heading">
            <h2 id="inquiry-heading" className="text-2xl text-light-text dark:text-dark-text mb-3">
              Tell me about your project
            </h2>
            <p className="text-sm leading-relaxed text-light-text-muted dark:text-dark-text-muted mb-6">
              A few details help me assess the work and discuss a fixed-scope
              project quote. A short note is enough to start.
            </p>
            <dl className="grid sm:grid-cols-2 gap-6">
              {inquiryDetails.map((detail) => (
                <div key={detail.title} className="border-t border-light-text/10 dark:border-dark-text/10 pt-4">
                  <dt className="text-sm font-medium text-light-text dark:text-dark-text mb-1">
                    {detail.title}
                  </dt>
                  <dd className="text-sm leading-relaxed text-light-text-muted dark:text-dark-text-muted">
                    {detail.description}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="elsewhere-heading" className="text-center space-y-6">
            <h2 id="elsewhere-heading" className="text-sm font-semibold tracking-wide uppercase text-light-text-muted dark:text-dark-text-muted">
              Elsewhere
            </h2>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${social.platform} (opens in a new tab)`}
                  className={`inline-flex items-center gap-2 px-4 sm:px-5 py-3 rounded-md bg-light-bg-secondary dark:bg-dark-bg-secondary border border-light-text/10 dark:border-dark-text/10 text-light-text-muted dark:text-dark-text-muted hover:text-light-accent dark:hover:text-dark-accent hover:-translate-y-0.5 transition-all ${focusStyles}`}
                >
                  {iconMap[social.platform] ?? <FiExternalLink aria-hidden="true" className="w-6 h-6" />}
                  <span className="text-sm">{social.platform}</span>
                </a>
              ))}
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
