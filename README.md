# angelina007.com

Personal portfolio and blog for **Angelina Huang** — a creative technologist working at the intersection of computing and art.

Live at [angelina007.com](https://angelina007.com)

## Overview

A modern, responsive portfolio and blog that showcases projects in machine learning, graphics programming, game development, and creative coding. The site has a dual-theme aesthetic — a cosmic starfield in dark mode and warm animated blobs with a playful cat in light mode — and a mobile-friendly CMS so blog posts can be written from anywhere.

## Tech Stack

- **Framework:** Next.js 14 (App Router, SSR/SSG hybrid)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom theme tokens
- **Fonts:** Space Mono, Space Grotesk, JetBrains Mono (via `next/font/google`)
- **Animation:** Canvas API for backgrounds, Framer Motion for UI transitions
- **CMS:** Sanity.io (headless, mobile-friendly editing)
- **Deployment:** Docker + Nginx reverse proxy on a Digital Ocean droplet
- **CI/CD:** GitHub Actions (push-to-main deploy)
- **SSL:** Let's Encrypt via Certbot (auto-renewing)

## Quick Start

```bash
# Install and run
npm install
npm run dev
# → http://localhost:3000

# Or with Docker
docker compose -f docker-compose.dev.yml up

# Sanity Studio (blog editor)
cd sanity && npm install && npm run dev
# → http://localhost:3333
```

Before running, copy `.env.example` to `.env.local` and set at least `NEXT_PUBLIC_SITE_URL`. Sanity-backed content pulls automatically once `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` are configured; otherwise the site falls back to `src/lib/placeholder-data.ts`.

## Project Structure

```
src/
├── app/             Next.js App Router pages (home, portfolio, blog, about, contact)
├── components/
│   ├── home/        Hero, FeaturedProjects, LatestPosts, CosmicBackground
│   ├── layout/      Navbar, Footer, ThemeToggle, ThemeProvider
│   ├── ui/          Button, Card, Tag, SectionHeading
│   ├── portfolio/   ProjectCard, ProjectGrid, FilterBar
│   ├── blog/        PostCard, PostList, TableOfContents
│   └── shared/      Analytics
├── lib/             constants, utils, Sanity client, placeholder data
├── styles/          Global CSS + Tailwind directives
└── types/           Shared TypeScript interfaces

sanity/              Sanity Studio config + schemas (post, category, project)
docker/              Dockerfile, Dockerfile.dev, nginx.conf
.github/workflows/   deploy.yml (GitHub Actions CI/CD)
scripts/             init-ssl.sh
```

## Deployment (summary)

Deploys happen automatically on push to `main` via GitHub Actions, which builds the Docker image on the Digital Ocean droplet and restarts the stack. First-time setup, SSH key generation, DNS configuration, SSL bootstrap, and ops commands are all covered in `DesignDoc.md` (sections on Deployment Architecture and Runbook).

## Documentation

- [DesignDoc.md](DesignDoc.md) — full technical spec: architecture, pages, components, theme system, Sanity schemas, deployment, runbook, and SEO strategy. This is the document to read if you want to understand or rebuild the site.
- [archive.md](archive.md) — supplementary material: Chinese (中文) development guide, content preparation checklist, placeholder-data reference, and historical notes.

## License

All rights reserved. This is a personal portfolio site.
