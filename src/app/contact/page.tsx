'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiSend } from 'react-icons/fi';
import { SiGithub, SiBilibili, SiYoutube, SiInstagram, SiArtstation, SiTwitter, SiLinkedin } from 'react-icons/si';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { SOCIAL_LINKS, SITE_METADATA } from '@/lib/constants';

const iconMap: Record<string, React.ReactNode> = {
  GitHub: <SiGithub className="w-6 h-6" />,
  Bilibili: <SiBilibili className="w-6 h-6" />,
  YouTube: <SiYoutube className="w-6 h-6" />,
  Instagram: <SiInstagram className="w-6 h-6" />,
  ArtStation: <SiArtstation className="w-6 h-6" />,
  Twitter: <SiTwitter className="w-6 h-6" />,
  LinkedIn: <SiLinkedin className="w-6 h-6" />,
};

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });

      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen py-20 md:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <SectionHeading
          title="Get in Touch"
          subtitle="Have a project in mind or just want to chat? I'd love to hear from you. Reach out through the form or connect with me on social media."
          className="mb-16 text-center"
        />

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Column - Contact Info */}
          <motion.div className="space-y-8" variants={itemVariants}>
            {/* Email */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-sm bg-light-accent/20 dark:bg-dark-accent/20">
                  <FiMail className="h-6 w-6 text-light-accent dark:text-dark-accent" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-1">
                  Email
                </h3>
                <a
                  href={`mailto:${SITE_METADATA.email}`}
                  className="text-light-text-muted dark:text-dark-text-muted hover:text-light-accent dark:hover:text-dark-accent transition-colors"
                >
                  {SITE_METADATA.email}
                </a>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-4">
                Connect
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {SOCIAL_LINKS.map((social) => (
                  <motion.a
                    key={social.platform}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-sm bg-light-bg-secondary dark:bg-dark-bg-secondary border border-light-text/10 dark:border-dark-text/10 hover:border-light-accent dark:hover:border-dark-accent text-light-text-muted dark:text-dark-text-muted hover:text-light-accent dark:hover:text-dark-accent transition-all flex items-center justify-center"
                    whileHover={{ scale: 1.05, y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span title={social.platform}>
                      {iconMap[social.platform] || <FiMail className="w-6 h-6" />}
                    </span>
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="p-6 rounded-md bg-light-bg-secondary dark:bg-dark-bg-secondary border border-light-accent/30 dark:border-dark-accent/30">
              <p className="text-sm font-semibold text-light-accent dark:text-dark-accent mb-2">
                Availability
              </p>
              <p className="text-light-text-muted dark:text-dark-text-muted">
                I'm currently open to freelance projects, collaborations, and interesting opportunities. Feel free to reach out!
              </p>
            </div>
          </motion.div>

          {/* Right Column - Contact Form */}
          <motion.div variants={itemVariants}>
            {submitted ? (
              <motion.div
                className="h-full flex items-center justify-center p-8 rounded-md bg-green-500/10 dark:bg-green-400/10 border border-green-500/50 dark:border-green-400/50"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="text-center">
                  <div className="w-16 h-16 rounded bg-green-500 dark:bg-green-400 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-light-text dark:text-dark-text mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-light-text-muted dark:text-dark-text-muted">
                    Thank you for reaching out. I'll get back to you as soon as possible.
                  </p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-sm bg-light-bg-secondary dark:bg-dark-bg-secondary border ${
                      errors.name
                        ? 'border-red-500 dark:border-red-400'
                        : 'border-light-text/10 dark:border-dark-text/10'
                    } text-light-text dark:text-dark-text placeholder-light-text-muted dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent transition-colors`}
                    placeholder="Your name"
                  />
                  {errors.name && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-sm bg-light-bg-secondary dark:bg-dark-bg-secondary border ${
                      errors.email
                        ? 'border-red-500 dark:border-red-400'
                        : 'border-light-text/10 dark:border-dark-text/10'
                    } text-light-text dark:text-dark-text placeholder-light-text-muted dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent transition-colors`}
                    placeholder="your.email@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-sm bg-light-bg-secondary dark:bg-dark-bg-secondary border ${
                      errors.subject
                        ? 'border-red-500 dark:border-red-400'
                        : 'border-light-text/10 dark:border-dark-text/10'
                    } text-light-text dark:text-dark-text placeholder-light-text-muted dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent transition-colors`}
                    placeholder="What's this about?"
                  />
                  {errors.subject && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.subject}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className={`w-full px-4 py-2 rounded-sm bg-light-bg-secondary dark:bg-dark-bg-secondary border ${
                      errors.message
                        ? 'border-red-500 dark:border-red-400'
                        : 'border-light-text/10 dark:border-dark-text/10'
                    } text-light-text dark:text-dark-text placeholder-light-text-muted dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent transition-colors resize-none`}
                    placeholder="Tell me more about your project..."
                  />
                  {errors.message && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button type="submit" size="lg" variant="primary" className="w-full">
                  <FiSend className="w-5 h-5" />
                  Send Message
                </Button>
              </form>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
