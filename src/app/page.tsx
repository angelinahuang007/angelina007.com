import { Hero } from '@/components/home/Hero';
import { FeaturedProjects } from '@/components/home/FeaturedProjects';
import Link from 'next/link';
import { FEATURED_PROJECTS } from '@/lib/content';

const services = [
  {
    title: '3D assets & scenes',
    description: 'Models, materials, and scenes shaped around your visual direction and the environment they need to work in.',
  },
  {
    title: 'Simulation support',
    description: 'Scene preparation, task setup, and debugging for embodied AI training and simulation workflows.',
  },
  {
    title: 'Interactive experiences',
    description: 'Design and prototypes that bring 3D content into an experience people can explore.',
  },
];

export const metadata = {
  title: 'Home',
};

export default function Home() {
  return (
    <>
      <Hero />
      <section id="services" className="scroll-mt-20 px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t border-light-text/10 dark:border-dark-text/10">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-light-accent dark:text-dark-accent-light mb-4">Ways to work together</p>
          <h2 className="text-3xl md:text-4xl text-light-text dark:text-dark-text mb-12">From a 3D idea to a working scene.</h2>
          <div className="grid md:grid-cols-3 gap-10 md:gap-12">
            {services.map((service, index) => (
              <div key={service.title} className="border-t border-light-text/15 dark:border-dark-text/15 pt-6">
                <span className="text-xs text-light-accent dark:text-dark-accent-light">0{index + 1}</span>
                <h3 className="text-lg text-light-text dark:text-dark-text mt-4 mb-3">{service.title}</h3>
                <p className="font-sans text-base leading-relaxed text-light-text-muted dark:text-dark-text-muted">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {FEATURED_PROJECTS.length > 0 && <FeaturedProjects projects={FEATURED_PROJECTS.slice(0, 3)} />}
      <section className="px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="max-w-6xl mx-auto border-t border-light-text/10 dark:border-dark-text/10 pt-12 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-3xl text-light-text dark:text-dark-text mb-4">Have something in mind?</h2>
            <p className="font-sans text-light-text-muted dark:text-dark-text-muted leading-relaxed">Tell me what you want to make, what you already have, and when you need it. We can define the deliverables and agree on a project quote.</p>
          </div>
          <Link href="/contact" className="shrink-0 self-start md:self-auto inline-flex items-center gap-3 py-3 text-sm text-light-accent dark:text-dark-accent-light hover:underline underline-offset-4">Start a conversation <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
    </>
  );
}
