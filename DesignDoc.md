# angelina007.com — Design Document

This document is the single source of truth for the site's architecture and design. It is written so that another engineer (or agent) can use it to reconstruct the site end-to-end without needing the existing codebase. It covers goals, stack rationale, file layout, every page, every component, the theme system, the CMS schema, deployment topology, and operational runbook.

---

## 1. Product Goals

1. A professional, polished personal website that serves as the central hub for all of Angelina Huang's online presence.
2. Responsive and performant on every screen size, browser, OS, and platform (desktop, tablet, mobile, iOS Safari, Android Chrome).
3. Easy to maintain — especially blog content, which must be editable from any device, including a phone, without git or a terminal.
4. Strong SEO, WCAG 2.1 AA accessibility, and fast load times.
5. Dark/light theme with a distinct artistic identity in each mode.

Non-goals: e-commerce, user accounts, comments, or any feature that requires a persistent server-side database beyond Sanity.

---

## 2. Tech Stack and Rationale

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 14 (App Router) | SSR/SSG hybrid, built-in image optimization, metadata API, route-level code splitting. |
| Language | TypeScript 5 | Type safety across components, CMS data, and shared utilities. |
| Styling | Tailwind CSS 3 | Utility-first, responsive design, class-based dark mode. |
| Animation | Framer Motion + raw Canvas 2D | Framer Motion for UI, Canvas for the interactive home-page backgrounds. |
| CMS | Sanity.io | Hosted studio works on mobile browsers; generous free tier; real-time preview; purpose-built for structured content. |
| Portable Text | `@portabletext/react` | Render Sanity's rich text in React. |
| Code highlighting | `sugar-high` | Tiny, zero-dep syntax highlighter for blog code blocks. |
| Icons | `react-icons` | Broad set with tree-shaking. |
| Image optimization | Next.js Image + `sharp` | Built-in optimization pipeline. |
| Theming | `next-themes` | Dark/light class switching with system preference and localStorage persistence. |
| Deployment | Docker + Nginx on Digital Ocean | Reuses existing droplet infrastructure; reproducible builds. |
| CI/CD | GitHub Actions | Push-to-main triggers remote build + restart. |
| SSL | Let's Encrypt via Certbot | Free, auto-renewing certificates. |
| Analytics | Umami / Plausible / GA4 (configurable) | Privacy-friendly by default; pluggable via `NEXT_PUBLIC_ANALYTICS_ID`. |

### Why these choices over the obvious alternatives

- **Sanity over Markdown files:** Markdown requires git to publish, which rules out posting from a phone. Sanity Studio is a hosted web app that is usable on mobile.
- **Sanity over Django admin:** A full Django backend adds database migrations, server patching, and auth to operate for content that could otherwise be static. Next.js + Sanity removes the backend entirely while keeping the content editable.
- **Sanity over Notion API:** Notion's API is rate-limited and not designed for public website rendering, which makes it unreliable under load.
- **Canvas over WebGL for backgrounds:** The starfield and blob visuals are 2D and need to run well on low-powered phones. Canvas 2D is sufficient and has zero dependencies.
- **Docker over Vercel:** Reuses the existing Digital Ocean droplet, gives full control over nginx and certificates, and keeps hosting cost predictable.

---

## 3. Repository Layout

```
angelina007.com/
├── .github/workflows/deploy.yml      GitHub Actions CI/CD
├── docker/
│   ├── Dockerfile                    Production multi-stage build
│   ├── Dockerfile.dev                Development image
│   └── nginx.conf                    Reverse proxy + SSL + security headers
├── docker-compose.yml                Prod stack (next-app + nginx + certbot)
├── docker-compose.dev.yml            Dev stack
├── scripts/
│   └── init-ssl.sh                   Bootstraps Let's Encrypt on first deploy
├── public/
│   ├── fonts/                        Local font fallbacks (optional)
│   ├── images/
│   │   ├── profile.jpg
│   │   ├── og-default.jpg
│   │   └── projects/                 Per-project thumbnails and hero images
│   ├── files/resume.pdf
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── app/                          Next.js App Router
│   │   ├── layout.tsx                Root layout, fonts, ThemeProvider, Navbar, Footer
│   │   ├── page.tsx                  Home
│   │   ├── loading.tsx
│   │   ├── not-found.tsx
│   │   ├── error.tsx
│   │   ├── sitemap.ts                Dynamic sitemap.xml
│   │   ├── portfolio/
│   │   │   ├── page.tsx              Portfolio grid + filter
│   │   │   └── [slug]/page.tsx       Project detail
│   │   ├── blog/
│   │   │   ├── page.tsx              Blog list
│   │   │   └── [slug]/page.tsx       Blog post
│   │   ├── about/page.tsx
│   │   └── contact/page.tsx
│   ├── components/
│   │   ├── home/                     Hero, FeaturedProjects, LatestPosts, CosmicBackground
│   │   ├── layout/                   Navbar, Footer, ThemeToggle, ThemeProvider
│   │   ├── ui/                       Button, Card, Tag, SectionHeading
│   │   ├── portfolio/                ProjectCard, ProjectGrid, FilterBar
│   │   ├── blog/                     PostCard, PostList, TableOfContents
│   │   └── shared/                   Analytics
│   ├── lib/
│   │   ├── constants.ts              Site metadata, nav links, social links, category colors
│   │   ├── placeholder-data.ts       Fallback content when Sanity is not configured
│   │   ├── utils.ts                  Helper functions
│   │   └── sanity/client.ts          Sanity client, GROQ queries, image URL builder
│   ├── styles/globals.css            Tailwind directives + custom properties
│   └── types/index.ts                Shared TypeScript interfaces
├── sanity/
│   ├── sanity.config.ts              Studio config
│   ├── package.json                  Standalone studio dependencies
│   └── schemas/
│       ├── index.ts                  Schema registration
│       ├── post.ts                   Blog post schema
│       ├── category.ts               Post category schema
│       └── project.ts                Portfolio project schema
├── next.config.js
├── next-env.d.ts
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── package.json
├── package-lock.json
├── .env.example
├── .dockerignore
├── .gitignore
├── README.md
├── DesignDoc.md                      (this file)
└── archive.md                        Supplementary content + 中文版 guide
```

---

## 4. Pages

All pages live under `src/app/` using the Next.js App Router. Each route exports a React component plus optional `metadata`, `generateStaticParams`, and `generateMetadata` for SEO.

### 4.1 Home — `/`

- **Hero:** Name, tagline ("Computing × Art"), short intro paragraph, two CTA buttons (`View Portfolio`, `Read Blog`), social links strip. Uses Space Mono for the name and Space Grotesk for body text.
- **Interactive background (`CosmicBackground`):** Full-viewport canvas behind the hero. See section 6.
- **Featured Projects:** Grid of 3–4 cards pulled from Sanity (`featured == true`) with fallback to `placeholder-data.ts`.
- **Latest Posts:** 2–3 most recent blog posts.
- **Footer CTA:** Links to portfolio, blog, contact.

### 4.2 Portfolio — `/portfolio`

- Filterable grid of projects by category (`ml-ai`, `graphics`, `game-dev`, `web`, `tools`).
- Each card: category-colored thumbnail, title, one-line description, tech tags.
- Filter bar is client-side; grid is SSR-rendered from Sanity and hydrated.

### 4.3 Project Detail — `/portfolio/[slug]`

- Hero image or embedded video/demo.
- Title, categories, tech stack badges, date, status.
- Long description rendered via Portable Text.
- Optional image gallery.
- Links: live demo, GitHub repo, related blog post slug.
- `generateStaticParams` enumerates slugs at build time for SSG; new slugs fall back to ISR.

### 4.4 Blog — `/blog`

- List view: title, date, estimated reading time, tags, preview image.
- Optional category/tag filter.
- Pagination (10 posts per page) or infinite scroll — pick one and be consistent.
- Data source: Sanity, ordered by `publishedAt desc`.

### 4.5 Blog Post — `/blog/[slug]`

- Title, publish date, reading time, tag list, cover image.
- Auto-generated Table of Contents from Portable Text headings (h2, h3).
- Reading progress indicator (sticky top bar driven by scroll position).
- Rich content: code blocks with `sugar-high` highlighting, images via `next/image`, optional video embeds.
- Related posts section (same category, excluding current post).
- Share buttons (Twitter, copy-link, etc.).

### 4.6 About — `/about`

- Profile photo (square, fallback to "AH" initials avatar).
- Extended bio (3–5 paragraphs).
- Skills grouped by category (languages, frontend, graphics & game dev, ML, backend, tools).
- Timeline / milestones (year → event).
- Resume download button pointing at `public/files/resume.pdf`.

### 4.7 Contact — `/contact`

- Contact form (name, email, subject, message). Submission handler is either a Next.js API route using SMTP or a third-party form service — choose one at build time.
- Email address displayed with basic spam obfuscation.
- Social media links.
- Optional Calendly embed for scheduling.

### 4.8 System routes

- `loading.tsx` — global fallback spinner.
- `not-found.tsx` — 404 page.
- `error.tsx` — error boundary with "try again" button.
- `sitemap.ts` — dynamic sitemap that enumerates static routes and CMS-driven slugs.
- `robots.txt` — static in `public/`.

---

## 5. Components

All components are TypeScript React components. Client components are marked with `'use client'` when they need browser APIs (canvas, scroll listeners, localStorage).

### 5.1 Layout (`src/components/layout/`)

- **Navbar** — Sticky, glassmorphic (backdrop-blur, low-opacity background), hides on scroll-down and reveals on scroll-up. Shows the `"A."` text logo (`font-light tracking-widest` in accent color), desktop nav links, theme toggle, and a hamburger menu on mobile. Uses `NAVIGATION_LINKS` from `src/lib/constants.ts`.
- **Footer** — Copyright, social icons from `SOCIAL_LINKS`, small nav list.
- **ThemeProvider** — Wraps the app in `next-themes` provider with `attribute="class"`, `defaultTheme="system"`, `enableSystem`.
- **ThemeToggle** — Button that toggles between `light`, `dark`, and `system`. Uses `react-icons` sun/moon icons. Hydration-safe (renders nothing until mounted).

### 5.2 UI primitives (`src/components/ui/`)

- **Button** — Variants: `primary`, `secondary`, `ghost`. Sizes: `sm`, `md`, `lg`. Uses `rounded-sm`, accent color backgrounds, subtle hover lift.
- **Card** — Container with `rounded-md`, 1px border, hover lift. Used by project and post cards.
- **Tag** — Pill for categories and tech badges. Small uppercase text in mono font.
- **SectionHeading** — H2 with accent underline and subtitle slot.

### 5.3 Home (`src/components/home/`)

- **Hero** — Name, tagline, intro, CTA buttons, social strip.
- **FeaturedProjects** — Grid wrapper that fetches featured projects and renders `ProjectCard`s.
- **LatestPosts** — Fetches recent posts and renders `PostCard`s.
- **CosmicBackground** — Interactive canvas (see section 6).

### 5.4 Portfolio (`src/components/portfolio/`)

- **ProjectCard** — Category-colored thumbnail, title, description, tag row. Entire card is a link to `/portfolio/[slug]`.
- **ProjectGrid** — Responsive grid (1/2/3 columns at sm/md/lg).
- **FilterBar** — Client component holding the active category filter.

### 5.5 Blog (`src/components/blog/`)

- **PostCard** — Cover image, title, date, reading time, tag row.
- **PostList** — Ordered list wrapper with pagination controls.
- **TableOfContents** — Parses headings from a rendered post and shows a sticky sidebar with scroll spy.

### 5.6 Shared (`src/components/shared/`)

- **Analytics** — Loads whichever analytics script is configured via `NEXT_PUBLIC_ANALYTICS_ID`. Supports Umami, Plausible, and GA4.

---

## 6. Interactive Background System

The home page has a full-viewport canvas (`CosmicBackground`) that renders very different visuals per theme. It runs on `requestAnimationFrame` and respects `prefers-reduced-motion` (renders a single static frame when reduced motion is on).

### 6.1 Dark mode — cosmic starfield

- Hundreds of stars with parallax depth layers.
- Each star has position, depth, twinkle phase, and color drawn from a small palette of white and indigo.
- Mouse acts as a weak gravity source — nearby stars drift toward the cursor.
- When the cursor is close to a cluster of stars, constellation lines draw between them with opacity proportional to distance.
- Twinkle via a slow sine over each star's phase.

### 6.2 Light mode — warm blobs with a cat

- 3–5 large warm-orange radial blobs (`#b45309`, `#d97706`) with a slow "breathing" scale animation and additive blending.
- A soft mouse glow follows the cursor.
- A small pixel cat chases the cursor with easing; when the cursor is still for >1s, the cat sits and its tail animates.

### 6.3 Implementation notes

- Use a single canvas sized to `window.innerWidth × window.innerHeight` with `devicePixelRatio` scaling.
- Read the current theme from `next-themes` and swap render functions on change.
- Pause the animation loop when the tab is hidden (`document.visibilityState`).
- Clean up the loop and event listeners in the component's `useEffect` cleanup.
- Keep the per-frame cost low: pre-compute gradients, avoid per-frame allocations, and cap the number of entities on small screens.

---

## 7. Theme System

### 7.1 Modes

- `system` (default), `light`, `dark`. Handled by `next-themes` with `attribute="class"` on `<html>`.
- User preference persisted in localStorage.
- `background-color` and `color` have CSS transitions for smooth switching.

### 7.2 Tailwind theme tokens (`tailwind.config.ts`)

```
colors.dark = {
  bg:            '#0f0f14',
  'bg-secondary':'#1a1b27',
  text:          '#e4e4e7',
  'text-muted':  '#a1a1aa',
  accent:        '#6366f1',  // indigo
  'accent-light':'#818cf8',
  sky:           '#38bdf8',
}
colors.light = {
  bg:            '#ffffff',
  'bg-secondary':'#f4f4f5',
  text:          '#18181b',
  'text-muted':  '#52525b',
  accent:        '#b45309',  // warm orange
  'accent-light':'#d97706',
  sky:           '#d97706',
}
```

Fonts:

```
fontFamily.mono = var(--font-space-mono), monospace
fontFamily.sans = var(--font-space-grotesk), system-ui, sans-serif
fontFamily.code = var(--font-jetbrains-mono), Menlo, Monaco, monospace
```

Other extensions: `letterSpacing.wider-custom = 0.06em`, `spacing.128 = 32rem`, `transitionDuration.2000 = 2000ms`.

### 7.3 Typography rules

- Primary UI text uses Space Mono for a technical feel.
- Long-form paragraphs (bios, blog body, project descriptions) use Space Grotesk weight 300 for readability.
- Code blocks use JetBrains Mono.
- Body text globally has `tracking-wide`.

### 7.4 UI style rules

- Rounded corners are minimal: `rounded-sm` for buttons, `rounded-md` for cards.
- No gradients in UI chrome — solid colors only. (Blobs in the background canvas are the exception.)
- No excessive animation on static UI — only subtle hover lifts and fades.
- Navbar is glassmorphic and hides on scroll-down.

### 7.5 Category colors

Used on `ProjectCard` thumbnails and filter chips. From `src/lib/constants.ts`:

| Category | Tailwind class |
|----------|----------------|
| `ml-ai` | `bg-sky-600` |
| `graphics` | `bg-purple-600` |
| `game-dev` | `bg-emerald-600` |
| `web` | `bg-amber-600` |
| `tools` | `bg-light-accent` |

---

## 8. Content Model (Sanity)

Sanity Studio lives in `sanity/` as a standalone package that can be run with `npm run dev` from inside that folder. Schemas are registered from `sanity/schemas/index.ts`.

### 8.1 `post` (blog post)

| Field | Type | Notes |
|-------|------|-------|
| title | string | required |
| slug | slug | generated from title |
| publishedAt | datetime | required |
| excerpt | text | 1–2 sentences |
| coverImage | image | with alt text |
| categories | array of reference → category | |
| tags | array of string | |
| body | array (Portable Text) | with code block, image, and embed blocks |
| author | reference | optional, single-author site |
| readingTime | number | minutes, computed on save (or at read time) |

### 8.2 `category`

| Field | Type |
|-------|------|
| title | string |
| slug | slug |
| description | text |
| color | string (optional Tailwind class) |

### 8.3 `project` (portfolio)

| Field | Type | Notes |
|-------|------|-------|
| title | string | |
| slug | slug | |
| category | string list | `ml-ai`, `graphics`, `game-dev`, `web`, `tools` |
| thumbnail | image | 16:9, min 800×450 |
| heroImage | image | wider banner |
| shortDescription | string | grid card copy |
| description | array (Portable Text) | long form |
| techStack | array of string | |
| date | date | |
| status | string list | `completed`, `in-progress`, `archived` |
| demoUrl | url | optional |
| githubUrl | url | optional |
| relatedPostSlug | string | optional |
| gallery | array of image | optional |
| featured | boolean | home-page filter |

### 8.4 Client and queries (`src/lib/sanity/client.ts`)

- Exports a `createClient` instance using `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, and `apiVersion`.
- Exports an image URL builder from `@sanity/image-url`.
- Exports GROQ query helpers: `getAllPosts`, `getPostBySlug`, `getAllProjects`, `getProjectBySlug`, `getFeaturedProjects`, `getLatestPosts`.
- If the env vars are missing, each helper falls back to data in `src/lib/placeholder-data.ts` so the site still builds and renders.

---

## 9. Responsive and Accessibility Requirements

### 9.1 Breakpoints

| Breakpoint | Width | Target |
|-----------|-------|--------|
| xs | < 480px | Small phones |
| sm | 480–639px | Large phones |
| md | 640–767px | Small tablets |
| lg | 768–1023px | Tablets / small laptops |
| xl | 1024–1279px | Laptops |
| 2xl | ≥ 1280px | Desktops / large screens |

### 9.2 Browser support

- Chrome, Firefox, Safari, Edge (latest 2 versions each).
- iOS Safari and Samsung Internet current.
- Graceful degradation for older browsers — no hard failures if canvas or backdrop-filter is unsupported.

### 9.3 Platform considerations

- iOS Safari: safe-area insets, `100vh` fix (`100dvh` when available), touch targets ≥ 44px.
- Android Chrome: viewport meta tag, PWA-ready manifest.
- Desktop: hover states, keyboard navigation, visible focus rings.
- Accessibility: WCAG 2.1 AA, semantic HTML, ARIA labels, skip-to-content link, `prefers-reduced-motion` support, alt text on every image.

### 9.4 Performance targets

| Metric | Target |
|--------|--------|
| Lighthouse Performance | ≥ 95 |
| Lighthouse Accessibility | ≥ 95 |
| Lighthouse SEO | ≥ 95 |
| First Contentful Paint | < 1.2s |
| Largest Contentful Paint | < 2.0s |
| Cumulative Layout Shift | < 0.05 |
| Time to Interactive | < 2.5s |

---

## 10. SEO Strategy

- Per-page `<title>` and `<meta description>` via Next.js Metadata API.
- Open Graph and Twitter Card tags for social sharing; default OG image at `/og-image.jpg`.
- Structured data (JSON-LD) for `Person`, `WebSite`, and `BlogPosting` schemas.
- `sitemap.xml` generated dynamically from `src/app/sitemap.ts` (includes CMS-driven slugs).
- `robots.txt` in `public/`.
- Canonical URLs on every page.
- Semantic HTML hierarchy (one `h1` per page, consistent `h2`/`h3` structure).

---

## 11. Configuration

### 11.1 Environment variables (`.env.example`)

```
# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=

# Site
NEXT_PUBLIC_SITE_URL=https://angelina007.com

# Analytics (optional)
# Umami: site UUID | Plausible: domain | GA: measurement ID
NEXT_PUBLIC_ANALYTICS_ID=

# Contact form / SMTP (optional)
# NEXT_PUBLIC_CONTACT_EMAIL=
# SMTP_HOST=
# SMTP_PORT=
# SMTP_USER=
# SMTP_PASSWORD=
# SMTP_FROM=

# Development
NODE_ENV=development
NEXT_PUBLIC_DEBUG=false
```

### 11.2 Site metadata (`src/lib/constants.ts`)

```
SITE_METADATA = {
  title: 'Angelina Huang — Computing × Art',
  description: '...intersection of computing and art through interactive projects, graphics programming, machine learning, and creative tools.',
  url: 'https://angelina007.com',
  image: 'https://angelina007.com/og-image.jpg',
  author: 'Angelina Huang',
  email: 'contact@angelina007.com',
}
```

Plus `NAVIGATION_LINKS`, `SOCIAL_LINKS`, and `CATEGORY_COLORS`.

### 11.3 Key build configs

- `next.config.js` — image domains (Sanity CDN), strict mode, experimental flags as needed.
- `tailwind.config.ts` — `darkMode: 'class'`, content globs under `src/**/*.{ts,tsx}`, custom theme tokens from section 7.2.
- `tsconfig.json` — path alias `@/*` → `src/*`, strict mode on.
- `postcss.config.js` — `tailwindcss` + `autoprefixer`.

---

## 12. Deployment Architecture

```
GitHub (push to main)
  → GitHub Actions (SSH into droplet, pull, build, restart)
    → Digital Ocean droplet (Ubuntu)
      → Docker Compose
          ├── next-app       Next.js in Node, internal port 3000
          ├── nginx          Reverse proxy on 80/443, terminates TLS
          └── certbot        Renews Let's Encrypt cert every 12h

Domain: angelina007.com → droplet IP (A record for @ and www)
SSL: Let's Encrypt
CDN: optional Cloudflare in front
```

### 12.1 `docker-compose.yml` (production)

- **next-app:** builds from `docker/Dockerfile`, exposes 3000 internally, reads env vars for `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ANALYTICS_ID`, `NEXT_PUBLIC_SANITY_*`, and `SANITY_API_TOKEN`. Healthcheck via `wget --spider` against `/`. JSON file logging with rotation.
- **nginx:** `nginx:alpine`, mounts `docker/nginx.conf` read-only and the Certbot config/webroot volumes. Publishes ports 80 and 443. Depends on `next-app`.
- **certbot:** `certbot/certbot`, mounts the same Let's Encrypt volumes. Entrypoint loops `certbot renew --webroot` every 12 hours.

### 12.2 `docker/Dockerfile`

Multi-stage Node 20 build: `deps` → `builder` → `runner`. Copies only the `.next/standalone` output and `public/` into the runner stage. Runs as a non-root user. `CMD ["node", "server.js"]`.

### 12.3 `docker/Dockerfile.dev`

Single-stage Node image that installs deps and runs `npm run dev` with the project mounted as a volume.

### 12.4 `docker/nginx.conf`

- HTTP→HTTPS redirect on port 80.
- HTTPS server on 443 with `ssl_certificate` and `ssl_certificate_key` from `/etc/letsencrypt/live/angelina007.com/`.
- `proxy_pass http://next-app:3000` for all routes except `/.well-known/acme-challenge/` which is served from the Certbot webroot.
- Security headers: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`.
- Gzip on for text/js/css/svg.

### 12.5 `scripts/init-ssl.sh`

First-time SSL bootstrap:

1. Generate a temporary self-signed cert so nginx can start.
2. `docker compose up -d next-app nginx`.
3. `docker compose run --rm certbot certonly --webroot -w /var/www/certbot -d angelina007.com -d www.angelina007.com --email $1 --agree-tos --no-eff-email`.
4. Replace the self-signed cert with the real cert and `docker compose exec nginx nginx -s reload`.
5. Start the certbot renewal loop container.

### 12.6 GitHub Actions (`.github/workflows/deploy.yml`)

On push to `main`:

1. Check out the repo.
2. SSH into the droplet using `DROPLET_HOST`, `DROPLET_USER`, and `DROPLET_SSH_KEY` secrets.
3. `cd ~/angelina007.com && git pull origin main && docker compose build && docker compose up -d`.
4. Optional post-deploy healthcheck against `https://angelina007.com`.

Required secrets: `DROPLET_HOST`, `DROPLET_USER`, `DROPLET_SSH_KEY`, and optionally `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET`.

---

## 13. First-Time Deployment Runbook

The full original walkthrough lived in the old `DEPLOY.md`. The steps below condense it.

1. **Clean up any old app on the droplet.** Stop and disable old Django/gunicorn/supervisor services and system nginx. Free ports 80 and 443 with `sudo lsof -i :80` and `sudo lsof -i :443`.
2. **Install Docker and the compose plugin** (`get.docker.com` script, then `apt-get install docker-compose-plugin`). Add your user to the `docker` group.
3. **Clone the repo** into `~/angelina007.com`.
4. **Create `.env.production`** from `.env.example` and set at least `NEXT_PUBLIC_SITE_URL`.
5. **Point DNS:** add A records for `@` and `www` pointing at the droplet IP. Verify with `dig angelina007.com +short`.
6. **First build + SSL bootstrap:**
   ```
   docker compose build
   chmod +x scripts/init-ssl.sh
   ./scripts/init-ssl.sh your-email@example.com
   ```
7. **Configure GitHub Actions:** generate a deploy SSH key, copy the public key to the droplet with `ssh-copy-id`, then add `DROPLET_HOST`, `DROPLET_USER`, and `DROPLET_SSH_KEY` as GitHub repo secrets.

### 13.1 Common ops

- View logs: `docker compose logs -f [next-app|nginx|certbot]`.
- Restart: `docker compose restart`.
- Manual deploy: `git pull origin main && docker compose build && docker compose up -d`.
- Force SSL renewal: `docker compose run --rm certbot renew --force-renewal && docker compose exec nginx nginx -s reload`.
- Disk cleanup: `docker system df` then `docker system prune`.

### 13.2 Troubleshooting

- **Site won't load after DNS change:** give DNS a few minutes, verify `dig`, verify `docker compose ps` shows all services `Up`.
- **Port already in use:** find the holder with `sudo lsof -i :80` or `:443` and stop it.
- **SSL errors:** `docker compose run --rm certbot certificates` and re-run `init-ssl.sh`.
- **Build OOM on a 1 GB droplet:** add a 2 GB swapfile (`fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile`) and retry.

---

## 14. Development Workflow

```bash
# Local dev
npm install
npm run dev                                 # http://localhost:3000

# Docker dev (hot reload)
docker compose -f docker-compose.dev.yml up

# Sanity Studio
cd sanity && npm install && npm run dev     # http://localhost:3333

# Production build test (local)
docker compose up --build

# Deploy
git push origin main                        # triggers GitHub Actions
```

NPM scripts (`package.json`): `dev`, `build`, `start`, `lint`.

### 14.1 Milestones (for a fresh rebuild)

1. **M1 Foundation** — Project scaffold, layout, nav, footer, theme toggle, responsive skeleton.
2. **M2 Home** — Hero, CosmicBackground (both modes), featured projects, latest posts.
3. **M3 Portfolio** — Project grid, filter bar, detail pages, Sanity project schema + queries.
4. **M4 Blog** — Sanity post schema, blog list, post pages, code highlighting, TOC, reading progress.
5. **M5 About + Contact** — Bio page, skills, timeline, resume link, contact form.
6. **M6 Polish** — Animations, loading states, 404/500 pages.
7. **M7 SEO + Performance** — Metadata API, sitemap, Lighthouse pass.
8. **M8 Deployment** — Docker, nginx, Let's Encrypt, GitHub Actions.
9. **M9 Analytics + Monitoring** — Umami/Plausible wiring, uptime monitoring.

---

## 15. Quality Bar Checklist

- Every page renders in both dark and light themes without layout shifts.
- Every interactive element is keyboard-accessible with a visible focus ring.
- All images use `next/image` with explicit width/height and alt text.
- No console errors or warnings in development or production.
- Lighthouse scores meet the targets in section 9.4.
- The site falls back gracefully when Sanity is not configured (placeholder data).
- The home-page canvas respects `prefers-reduced-motion`.
- The Docker image builds reproducibly from a clean checkout.
- The GitHub Actions deploy workflow succeeds on a push to `main`.
