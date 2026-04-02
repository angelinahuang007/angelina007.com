# angelina007.com

Personal portfolio and blog for **Angelina Huang** — a creative technologist at the intersection of computing and art.

Live at [angelina007.com](https://angelina007.com)

## Overview

A modern, responsive portfolio website showcasing projects in machine learning, graphics programming, game development, and creative coding. Features a dual-theme design with an interactive canvas background — a cosmic starfield in dark mode and warm animated blobs with a playful cat in light mode.

## Tech Stack

- **Framework**: Next.js 14+ (App Router, SSR/SSG hybrid)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom theme tokens
- **Fonts**: Space Mono (headings/body) + Space Grotesk (long-form text) + JetBrains Mono (code)
- **Animation**: Canvas API (interactive backgrounds), Framer Motion (UI transitions)
- **CMS**: Sanity.io (headless, mobile-friendly editing)
- **Deployment**: Docker + Nginx reverse proxy on Digital Ocean
- **CI/CD**: GitHub Actions

## Color System

| Mode | Background | Accent | Text |
|------|-----------|--------|------|
| Dark | `#0f0f14` / `#1a1b27` | Indigo `#6366f1` | `#e4e4e7` / `#a1a1aa` |
| Light | `#ffffff` / `#f4f4f5` | Warm Orange `#b45309` | `#18181b` / `#52525b` |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### With Docker

```bash
# Development
docker compose -f docker-compose.dev.yml up

# Production
docker compose up --build
```

### Sanity Studio (CMS)

```bash
cd sanity
npm install
npm run dev
# Opens at http://localhost:3333
```

## Project Structure

```
src/
├── app/           # Next.js App Router pages
├── components/
│   ├── home/      # Hero, FeaturedProjects, LatestPosts, CosmicBackground
│   ├── layout/    # Navbar, Footer, ThemeToggle, ThemeProvider
│   ├── ui/        # Button, Card, Tag, SectionHeading
│   ├── portfolio/ # ProjectCard, ProjectGrid, FilterBar
│   ├── blog/      # PostCard, PostList, TableOfContents
│   └── shared/    # Analytics
├── lib/           # Constants, utilities, Sanity client, placeholder data
├── styles/        # Global CSS + Tailwind config
└── types/         # TypeScript interfaces
```

## Deployment

Deployed via GitHub Actions on push to `main`:

1. GitHub Actions builds a Docker image
2. Image is pushed to the Digital Ocean Droplet
3. Docker Compose runs Next.js behind Nginx with SSL (Let's Encrypt)

See `docker/` and `.github/workflows/deploy.yml` for configuration.

## Documentation

- [Deploy Guide](DEPLOY.md) — Step-by-step deployment on Digital Ocean
- [Development Guide](DEVELOPMENT_GUIDE.md) — Full technical spec, architecture decisions, and milestones
- [Development Guide (Chinese)](DEVELOPMENT_GUIDE_CN.md) — 开发指南中文版
- [Content Guide](CONTENT_GUIDE.md) — Content preparation checklist for populating the site

## License

All rights reserved. This is a personal portfolio site.
