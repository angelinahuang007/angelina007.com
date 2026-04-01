'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiSearch } from 'react-icons/fi';
import { BlogPost } from '@/types';
import { PostCard } from './PostCard';
import { Tag } from '@/components/ui/Tag';

interface PostListProps {
  posts: BlogPost[];
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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

export function PostList({ posts }: PostListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    posts.forEach((post) => {
      post.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTag = !activeTag || post.tags.includes(activeTag);

      return matchesSearch && matchesTag;
    });
  }, [posts, searchQuery, activeTag]);

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-muted dark:text-dark-text-muted" />
        <input
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-sm bg-light-bg-secondary dark:bg-dark-bg-secondary border border-light-text/10 dark:border-dark-text/10 text-light-text dark:text-dark-text placeholder-light-text-muted dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent"
        />
      </div>

      {/* Tag Filter */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-light-text dark:text-dark-text">
          Filter by tag
        </h3>
        <div className="flex flex-wrap gap-2">
          <motion.button
            onClick={() => setActiveTag(null)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
              activeTag === null
                ? 'bg-light-accent text-white'
                : 'bg-light-bg-secondary dark:bg-dark-bg text-light-text-muted dark:text-dark-text-muted hover:text-light-text dark:hover:text-dark-text'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            All
          </motion.button>
          {allTags.map((tag) => (
            <motion.button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                activeTag === tag
                  ? 'bg-light-accent text-white'
                  : 'bg-light-bg-secondary dark:bg-dark-bg text-light-text-muted dark:text-dark-text-muted hover:text-light-text dark:hover:text-dark-text'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tag}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <motion.div key={post.id} variants={itemVariants}>
              <PostCard post={post} />
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-light-text-muted dark:text-dark-text-muted text-lg">
              No articles found matching your search.
            </p>
          </div>
        )}
      </motion.div>

      {/* Results Count */}
      <p className="text-sm text-light-text-muted dark:text-dark-text-muted">
        Showing {filteredPosts.length} of {posts.length} articles
      </p>
    </div>
  );
}
