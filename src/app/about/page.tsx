'use client';

import { motion } from 'framer-motion';
import { FiDownload } from 'react-icons/fi';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { SKILLS, TIMELINE, ABOUT_BIO } from '@/lib/placeholder-data';

export default function AboutPage() {
  return (
    <div className="min-h-screen py-20 md:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Profile Section */}
        <motion.div
          className="mb-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Avatar */}
          <div className="mb-8 flex justify-center">
            <motion.div
              className="w-32 h-32 rounded-full bg-light-accent dark:bg-dark-accent p-1"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-full h-full rounded-full bg-light-bg dark:bg-dark-bg flex items-center justify-center text-4xl font-bold text-light-accent dark:text-dark-accent">
                AH
              </div>
            </motion.div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-light-text dark:text-dark-text mb-2">
            Angelina Huang
          </h1>
          <p className="text-xl text-light-text-muted dark:text-dark-text-muted mb-8">
            Creative Technologist
          </p>

          {/* Bio */}
          <div className="max-w-2xl mx-auto space-y-4 text-light-text-muted dark:text-dark-text-muted text-lg leading-relaxed mb-8">
            {ABOUT_BIO.split('\n\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          {/* Download Resume Button */}
          <a href="/files/resume.pdf" download>
            <Button size="lg" variant="primary">
              <FiDownload className="w-5 h-5" />
              Download Resume
            </Button>
          </a>
        </motion.div>

        {/* Skills Section */}
        <motion.section
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, margin: '-100px' }}
        >
          <SectionHeading
            title="Skills & Expertise"
            subtitle="A comprehensive overview of my technical and creative capabilities."
            className="mb-12"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {SKILLS.map((skillGroup) => (
              <motion.div
                key={skillGroup.category}
                className="p-6 rounded-md bg-light-bg-secondary dark:bg-dark-bg-secondary border border-light-text/10 dark:border-dark-text/10"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-bold text-light-text dark:text-dark-text mb-4">
                  {skillGroup.category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skillGroup.skills.map((skill) => (
                    <Tag key={skill} label={skill} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Timeline Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, margin: '-100px' }}
        >
          <SectionHeading
            title="Journey"
            subtitle="A timeline of my growth and exploration in technology and creative fields."
            className="mb-12"
          />

          <div className="relative space-y-12">
            {/* Timeline Line */}
            <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-1 bg-light-accent dark:bg-dark-accent md:transform md:-translate-x-1/2" />

            {/* Timeline Items */}
            {TIMELINE.map((event, idx) => (
              <motion.div
                key={idx}
                className={`relative pl-12 md:pl-0 md:w-1/2 ${idx % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:ml-auto md:pl-12'}`}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                {/* Dot */}
                <div className="absolute left-0 top-2 md:left-1/2 md:top-4 w-4 h-4 rounded-full bg-light-accent dark:bg-dark-accent transform md:-translate-x-1/2 border-4 border-light-bg dark:border-dark-bg" />

                {/* Content */}
                <div className="p-6 rounded-md bg-light-bg-secondary dark:bg-dark-bg-secondary border border-light-text/10 dark:border-dark-text/10">
                  <p className="text-sm font-semibold text-light-accent dark:text-dark-accent mb-1">
                    {event.year}
                  </p>
                  <h4 className="text-lg font-bold text-light-text dark:text-dark-text mb-2">
                    {event.title}
                  </h4>
                  <p className="text-light-text-muted dark:text-dark-text-muted">
                    {event.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
