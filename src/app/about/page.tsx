'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import { SOCIAL_LINKS } from '@/lib/constants';

const focusStyles =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-accent dark:focus-visible:ring-dark-accent focus-visible:ring-offset-4 focus-visible:ring-offset-light-bg dark:focus-visible:ring-offset-dark-bg';

export default function AboutPage() {
  return (
    <div className="min-h-screen py-20 md:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 flex justify-center">
            <motion.div
              className="w-32 h-32 rounded-full bg-light-accent dark:bg-dark-accent p-1"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <Image
                src="/images/profile.png"
                alt="Angelina Huang"
                width={128}
                height={128}
                priority
                className="w-full h-full rounded-full object-cover"
              />
            </motion.div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-light-text dark:text-dark-text mb-2">
            Angelina Huang
          </h1>
          <p className="text-xl text-light-text-muted dark:text-dark-text-muted mb-2">
            Computing × Art
          </p>
          <p className="text-sm text-light-accent dark:text-dark-accent-light mb-8">
            3D · Creative Technology · Embodied AI
          </p>

          <div className="max-w-2xl mx-auto space-y-4 font-sans text-light-text-muted dark:text-dark-text-muted text-base md:text-lg leading-relaxed mb-8">
            <p>
              I’m a creative technologist working across 3D and design. My current
              work involves embodied AI training, including 3D assets and scenes,
              simulation workflows, supporting scripts, and task debugging.
            </p>
            <p>
              My practice connects computing and art, bringing visual thinking
              to technical work. This portfolio is a place to share that work
              and the process behind it.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 mb-10">
            <Link
              href="/portfolio"
              className={`inline-flex items-center justify-center gap-2 px-7 py-3 rounded-sm bg-light-accent dark:bg-dark-accent text-white font-medium hover:bg-light-accent/90 dark:hover:bg-dark-accent/90 transition-colors ${focusStyles}`}
            >
              Explore My Work
              <FiArrowUpRight aria-hidden="true" className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className={`inline-flex items-center justify-center gap-2 px-7 py-3 rounded-sm border border-light-accent/40 dark:border-dark-accent/40 text-light-accent dark:text-dark-accent-light font-medium hover:bg-light-accent/10 dark:hover:bg-dark-accent/10 transition-colors ${focusStyles}`}
            >
              Discuss a Project
              <FiArrowUpRight aria-hidden="true" className="w-5 h-5" />
            </Link>
          </div>

          <nav aria-label="Social profiles" className="flex flex-wrap justify-center gap-x-6 gap-y-4">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.platform}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${social.platform} (opens in a new tab)`}
                className={`inline-flex items-center gap-1.5 rounded-sm text-sm text-light-text-muted dark:text-dark-text-muted hover:text-light-accent dark:hover:text-dark-accent-light transition-colors ${focusStyles}`}
              >
                {social.platform}
                <FiArrowUpRight aria-hidden="true" className="w-4 h-4" />
              </a>
            ))}
          </nav>
        </motion.div>
      </div>
    </div>
  );
}
