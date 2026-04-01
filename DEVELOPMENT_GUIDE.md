# angelina007.com

Personal portfolio and blog site for Angelina Huang — a developer and artist working at the intersection of computing and visual art.

## 1. Project Goals

- A professional, polished personal website that serves as the central hub for all online presence
- Optimized for every screen size, browser, OS, and platform (desktop, tablet, mobile)
- Easy to maintain — especially blog content, which should be editable from any device including mobile
- Fast load times, strong SEO, and accessibility compliance
- Supports dark/light theme switching

## 2. Tech Stack

### Recommended Architecture

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | **Next.js 14+ (App Router)** | SSR/SSG hybrid, excellent performance, image optimization, SEO-friendly |
| Styling | **Tailwind CSS** | Utility-first, responsive design built-in, easy dark/light theming |
| Animation | **Framer Motion** | Subtle, performant animations for page transitions and scroll effects |
| Content CMS | **Sanity.io** | Headless CMS with mobile-friendly editing studio, free tier, real-time preview. Manages all content: blog posts, portfolio projects, and about page |
| Language | **TypeScript** | Type safety across the entire frontend |
| Deployment | **Docker + Digital Ocean** | Containerized deployment on existing DO infrastructure |
| CI/CD | **GitHub Actions** | Auto-build and deploy on push to main |
| Analytics | **Plausible or Umami** | Privacy-friendly, self-hostable analytics |

### Why This Stack

**Why Sanity for blog instead of Markdown files or Django admin:**
Sanity provides a hosted editing studio (studio.angelina007.com) that works well on mobile browsers. You can write, edit, and publish blog posts from your phone without needing git, a terminal, or a desktop. It has a generous free tier (100K API requests/month), real-time content preview, and image optimization built in. No backend server to maintain for content management.

**Why not Django backend:**
For a personal portfolio + blog, a full Django backend adds operational complexity (database migrations, server maintenance, security patches) without significant benefit. Sanity handles content management, and Next.js handles rendering. If you need server-side logic later (contact forms, newsletter), Next.js API routes or serverless functions are sufficient.

**Why not Notion as CMS:**
Notion API has rate limits and caching issues that make it unreliable for a production site. Sanity is purpose-built for this use case.

## 3. Pages and Features

### 3.1 Home Page (`/`)

- Hero section with name, tagline ("Computing x Art"), and a brief intro
- Animated background or subtle visual element that reflects the art + tech identity
- Featured projects grid (3-4 highlighted works)
- Latest blog posts preview (2-3 recent posts)
- Call-to-action links to portfolio, blog, and contact
- Social links bar

### 3.2 Portfolio (`/portfolio`)

- Filterable grid of works by category: Game Dev, Graphics/Shaders, ML/AI, Web, Tools
- Each item shows: thumbnail, title, tech stack tags, short description
- Click to expand into full project detail page

### 3.3 Project Detail (`/portfolio/[slug]`)

- Hero image or embedded video/demo
- Project description, goals, and outcomes
- Tech stack breakdown
- Image gallery or video walkthrough
- Links to live demo, GitHub repo, related blog posts

### 3.4 Blog (`/blog`)

- List view with title, date, reading time, tags, preview image
- Category/tag filtering
- Search functionality
- Pagination or infinite scroll

### 3.5 Blog Post (`/blog/[slug]`)

- Full article with rich formatting (code blocks with syntax highlighting, images, embeds)
- Table of contents (auto-generated from headings)
- Reading progress indicator
- Related posts at the bottom
- Share buttons

### 3.6 About (`/about`)

- Extended bio and professional background
- Skills/tools visualization
- Timeline or milestones
- Downloadable resume (PDF)
- Profile photo

### 3.7 Contact (`/contact`)

- Contact form (name, email, subject, message)
- Social media links
- Email address (with spam protection)
- Optional: Calendly embed for scheduling calls

## 4. Cross-Platform and Responsive Requirements

### 4.1 Breakpoints

| Breakpoint | Width | Target |
|-----------|-------|--------|
| xs | < 480px | Small phones |
| sm | 480-639px | Large phones |
| md | 640-767px | Small tablets |
| lg | 768-1023px | Tablets / small laptops |
| xl | 1024-1279px | Laptops |
| 2xl | >= 1280px | Desktops / large screens |

### 4.2 Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions, including iOS Safari)
- Edge (latest 2 versions)
- Samsung Internet (latest)

### 4.3 Platform-Specific Considerations

- **iOS Safari:** Safe area insets for notch/dynamic island, 100vh fix, touch targets >= 44px
- **Android Chrome:** Material-style scrolling, viewport meta tag, PWA-ready manifest
- **Desktop:** Hover states, keyboard navigation, focus indicators
- **Accessibility:** WCAG 2.1 AA compliance, semantic HTML, ARIA labels, alt text, skip links, reduced motion support

### 4.4 Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse Performance | >= 95 |
| Lighthouse Accessibility | >= 95 |
| Lighthouse SEO | >= 95 |
| First Contentful Paint | < 1.2s |
| Largest Contentful Paint | < 2.0s |
| Cumulative Layout Shift | < 0.05 |
| Time to Interactive | < 2.5s |

## 5. Theme System

### 5.1 Dark/Light Mode

- Default to system preference (`prefers-color-scheme`)
- Manual toggle with persistent preference (localStorage)
- Smooth transition between themes (CSS transition on `background-color`, `color`)
- All components must be tested in both themes

### 5.2 Color Palette (Reference)

**Dark theme base:**
- Background: `#0f0f14` → `#1a1b27`
- Text: `#e4e4e7` (primary), `#a1a1aa` (secondary)
- Accent: `#6366f1` (indigo), `#38bdf8` (sky blue)

**Light theme base:**
- Background: `#ffffff` → `#f4f4f5`
- Text: `#18181b` (primary), `#52525b` (secondary)
- Accent: `#4f46e5` (indigo), `#0ea5e9` (sky blue)

## 6. Project Structure

```
angelina007.com/
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions CI/CD
├── public/
│   ├── fonts/
│   ├── images/
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout (theme provider, nav, footer)
│   │   ├── page.tsx              # Home
│   │   ├── portfolio/
│   │   │   ├── page.tsx          # Portfolio grid
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Project detail
│   │   ├── blog/
│   │   │   ├── page.tsx          # Blog list
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Blog post
│   │   ├── about/
│   │   │   └── page.tsx
│   │   └── contact/
│   │       └── page.tsx
│   ├── components/
│   │   ├── layout/               # Nav, Footer, ThemeToggle
│   │   ├── ui/                   # Buttons, Cards, Tags, etc.
│   │   ├── home/                 # Hero, FeaturedProjects, LatestPosts
│   │   ├── portfolio/            # ProjectGrid, ProjectCard, FilterBar
│   │   ├── blog/                 # PostList, PostCard, TableOfContents
│   │   └── shared/               # SEOHead, ImageWithFallback, LoadingSpinner
│   ├── lib/
│   │   ├── sanity/               # Sanity client, queries, types
│   │   ├── utils.ts              # Helper functions
│   │   └── constants.ts          # Site metadata, nav links, social links
│   ├── styles/
│   │   └── globals.css           # Tailwind directives, custom properties
│   ├── types/
│   │   └── index.ts              # Shared TypeScript types
│   └── hooks/
│       └── index.ts              # Custom React hooks
├── sanity/
│   ├── schemas/                  # Blog post, category, author schemas
│   └── sanity.config.ts
├── docker/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── nginx.conf
├── docker-compose.yml
├── docker-compose.dev.yml
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## 7. Deployment Architecture

```
GitHub (push to main)
  → GitHub Actions (build + push Docker image)
    → Digital Ocean Droplet
      → Docker Compose
        ├── Next.js container (Node.js, port 3000)
        ├── Nginx container (reverse proxy, SSL, port 80/443)
        └── (optional) Umami container (analytics)

Domain: angelina007.com
DNS: Digital Ocean → Droplet IP
SSL: Let's Encrypt via Certbot (auto-renew)
CDN: Cloudflare (optional, for caching and DDoS protection)
```

## 8. SEO Strategy

- Dynamic `<title>` and `<meta description>` per page via Next.js Metadata API
- Open Graph and Twitter Card meta tags for social sharing
- Structured data (JSON-LD) for Person, BlogPosting, WebSite schemas
- Auto-generated `sitemap.xml` and `robots.txt`
- Canonical URLs to prevent duplicate content
- Image alt text on all images
- Semantic HTML structure (h1-h6 hierarchy, landmark roles)

## 9. Development Workflow

```bash
# Local development
docker compose -f docker-compose.dev.yml up

# Or without Docker
cd src && npm install && npm run dev

# Sanity Studio (blog editing)
cd sanity && npm run dev
# Opens at http://localhost:3333

# Production build test
docker compose up --build

# Deploy (automatic via GitHub Actions on push to main)
git push origin main
```

## 10. Milestones

- [ ] **M1: Foundation** — Project setup, layout, nav, footer, theme toggle, responsive skeleton
- [ ] **M2: Home Page** — Hero, featured projects, latest posts sections
- [ ] **M3: Portfolio** — Project grid, filter, detail pages with Sanity content
- [ ] **M4: Blog** — Sanity integration, blog list, post pages, code highlighting
- [ ] **M5: About + Contact** — Bio page, contact form, resume download
- [ ] **M6: Polish** — Animations, loading states, error pages, 404
- [ ] **M7: SEO + Performance** — Meta tags, sitemap, Lighthouse optimization
- [ ] **M8: Deployment** — Docker setup, GitHub Actions, Digital Ocean, SSL, domain
- [ ] **M9: Analytics + Monitoring** — Umami/Plausible setup, uptime monitoring
