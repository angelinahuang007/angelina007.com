'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Project, ProjectCategory } from '@/types';
import { ProjectCard } from './ProjectCard';

interface ProjectGridProps {
  projects: Project[];
  activeFilter: ProjectCategory | 'all';
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.2 },
  },
};

export function ProjectGrid({ projects, activeFilter }: ProjectGridProps) {
  const filteredProjects =
    activeFilter === 'all'
      ? projects
      : projects.filter((p) => p.category === activeFilter);

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="wait">
        {filteredProjects.map((project) => (
          <motion.div
            key={project.id}
            variants={itemVariants}
            layout
          >
            <ProjectCard project={project} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
