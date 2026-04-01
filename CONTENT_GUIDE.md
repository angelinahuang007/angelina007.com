# angelina007.com — Content Guide

This document helps you prepare all the content needed to populate your website with real data. Fill in each section and gather the referenced assets. This is the single source of truth for site content.

本文档帮助你准备建站所需的所有内容素材。请填写每个部分并准备好相关素材。

---

## Current Design Decisions

Before filling in content, here's a summary of the design choices already implemented:

### Typography
- **Primary font** (headings, body): Space Mono (weights 400, 700) — monospace for a modern, technical feel
- **Long-form text** (descriptions, subtitles, paragraphs): Space Grotesk (weight 300) — clean sans-serif at light weight
- **Code blocks**: JetBrains Mono
- Body text uses `tracking-wide` letter spacing globally

### Color System
| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Background | `#ffffff` / `#f4f4f5` | `#0f0f14` / `#1a1b27` |
| Text | `#18181b` / `#52525b` | `#e4e4e7` / `#a1a1aa` |
| Accent | Warm Orange `#b45309` | Indigo `#6366f1` |
| Accent (hover) | `#d97706` | `#818cf8` |

### Interactive Backgrounds (Home Page)
- **Dark mode**: Cosmic starfield with parallax depth, mouse-following gravity, constellation lines near cursor, twinkling stars
- **Light mode**: Warm orange blobs with breathing animation, mouse glow, and a cute animated cat that chases the cursor

### UI Style
- Minimal rounded corners (`rounded-sm` for buttons, `rounded-md` for cards)
- No gradients — solid colors throughout
- No excessive animations — clean, static layouts with subtle hover effects
- Glassmorphic navbar with scroll-hide behavior

### Project Categories
Each category has a solid background color for thumbnails:
| Category | Color |
|----------|-------|
| ML/AI | `bg-sky-600` |
| Graphics | `bg-purple-600` |
| Game Dev | `bg-emerald-600` |
| Web | `bg-amber-600` |
| Tools | Theme accent color |

---

## 1. Branding Assets

### 1.1 Logo

The current logo is text-based: **"A."** displayed in the accent color with `font-light tracking-widest`. If you want a graphical logo, prepare:

| Item | Description | File Location |
|------|-------------|---------------|
| Primary logo (SVG) | Vector logo for nav bar. Transparent background. | `public/images/logo.svg` |
| Favicon (PNG) | 512x512 square version for browser tab / PWA icon | `public/favicon.ico` + `public/images/icon-512.png` |
| OG Image | 1200x630 default social share image | `public/images/og-default.jpg` |

### 1.2 Typography Confirmation

Current: Space Mono + Space Grotesk + JetBrains Mono (loaded via next/font/google).

> _TODO: Confirm these fonts or suggest alternatives._

---

## 2. Home Page Content

### 2.1 Hero Section

| Field | Current Placeholder | Your Content |
|-------|-------------------|--------------|
| Name | Angelina Huang | _(confirm)_ |
| Tagline | Computing x Art | _TODO_ |
| Short intro | "A creative technologist exploring the intersection of code and artistic expression. From machine learning and graphics programming to interactive experiences." | _TODO: Customize_ |
| CTA buttons | "View Portfolio" + "Read Blog" | _(confirm or change)_ |

### 2.2 Featured Projects (3)

These appear as cards on the home page. Currently using placeholder data. Replace with real projects:

| # | Project Name | One-line Description | Category | Thumbnail | Links |
|---|-------------|---------------------|----------|-----------|-------|
| 1 | _TODO_ | _TODO_ | ml-ai / graphics / game-dev / web / tools | `public/images/projects/xxx.jpg` | GitHub / Demo |
| 2 | _TODO_ | _TODO_ | _TODO_ | `public/images/projects/xxx.jpg` | _TODO_ |
| 3 | _TODO_ | _TODO_ | _TODO_ | `public/images/projects/xxx.jpg` | _TODO_ |

### 2.3 Latest Blog Posts (2)

The home page shows the 2 most recent blog posts. These are pulled from Sanity CMS (or placeholder data).

---

## 3. Portfolio Projects

All portfolio projects are managed in Sanity. For each project, prepare:

### Project Template

```
Project Name:
Slug: (URL-friendly, e.g. "neural-art-generator")
Category: [ml-ai / graphics / game-dev / web / tools]
Thumbnail: (16:9, min 800x450)
Hero Image: (wider banner for detail page)
Short Description: (1-2 sentences, shown in grid card)
Full Description: (detailed write-up, multiple paragraphs)
Tech Stack: [e.g. Python, TensorFlow, React, ...]
Date: YYYY-MM-DD
Status: [completed / in-progress / archived]
Links:
  - Demo URL:
  - GitHub URL:
  - Related Blog Post Slug:
Gallery Images: (optional, list of files)
```

### Your Projects

> _TODO: Fill in using the template above. Thumbnails go in `public/images/projects/`._

---

## 4. About Page

### 4.1 Profile Photo

| Item | Spec | File Location |
|------|------|---------------|
| Profile photo | Square, min 400x400 | `public/images/profile.jpg` |

Currently using initials "AH" as avatar placeholder.

### 4.2 Bio

> _TODO: Write 3-5 paragraphs covering your background, what drives you, your intersection of computing and art, and current focus._

Current placeholder:
> "Hi, I'm Angelina Huang, a creative technologist passionate about the intersection of computing and art..."

### 4.3 Skills & Tools

Current placeholder groups (update as needed):

| Category | Skills |
|----------|--------|
| Languages | Python, C++, JavaScript, TypeScript, GLSL, GDScript, Rust |
| Frontend | React, Next.js, Tailwind CSS, Framer Motion, Three.js, Canvas API, WebGL |
| Graphics & Game Dev | WebGL, GLSL, Three.js, Godot, Unreal Engine, Blender, Aseprite |
| Machine Learning | TensorFlow, PyTorch, Keras, scikit-learn, Neural Networks, Computer Vision, NLP |
| Backend & Database | Node.js, Express, PostgreSQL, MongoDB, Firebase, REST APIs, GraphQL |
| Tools & Platforms | Git, Docker, AWS, Vercel, GitHub, VS Code, Figma |

### 4.4 Timeline / Milestones

Current placeholder timeline:

| Year | Event |
|------|-------|
| 2024 | AI Art Exploration |
| 2023 | Graphics Programming |
| 2022 | Full-Stack Development |
| 2021 | Game Development Experiments |
| 2020 | Started Creative Coding |

> _TODO: Replace with real milestones._

### 4.5 Resume

| Item | File Location |
|------|---------------|
| Resume PDF | `public/files/resume.pdf` |

---

## 5. Blog

Blog posts are managed in Sanity Studio. Plan your first few posts:

| # | Title | Topic / Category | Draft Ready? |
|---|-------|-----------------|-------------|
| 1 | _TODO_ | tutorial / technical / insights | Yes / No |
| 2 | _TODO_ | _TODO_ | Yes / No |
| 3 | _TODO_ | _TODO_ | Yes / No |

### Blog Content Features

Sanity Portable Text supports rich content. Check which features you need:

- [x] Code blocks with syntax highlighting (built-in via sugar-high)
- [ ] Shader/WebGL live demos (custom component)
- [ ] Interactive code playgrounds
- [ ] Math equations (KaTeX)
- [ ] Video embeds (YouTube, Bilibili)
- [ ] Image galleries
- [ ] Before/after comparison sliders

---

## 6. Contact & Social Links

### 6.1 Social Links

Update URLs in `src/lib/constants.ts` → `SOCIAL_LINKS`:

| Platform | URL | Username |
|----------|-----|----------|
| GitHub | https://github.com/angelinahuang007 | angelinahuang007 |
| Bilibili | _TODO_ | _TODO_ |
| YouTube | _TODO_ | _TODO_ |
| Instagram | _TODO_ | _TODO_ |
| ArtStation | _TODO_ | _TODO_ |
| Twitter/X | _TODO_ | _TODO_ |
| LinkedIn | _TODO_ | _TODO_ |
| Email | _TODO_ | — |

### 6.2 Contact Form

> _TODO: Email address to receive form submissions_

---

## 7. SEO & Metadata

Update in `src/lib/constants.ts` → `SITE_METADATA`:

| Field | Current Value | Your Value |
|-------|--------------|------------|
| Site title | Angelina Huang — Computing x Art | _TODO: confirm_ |
| Description | A portfolio exploring the intersection... | _TODO: customize_ |
| URL | https://angelina007.com | _(confirm)_ |
| OG Image | /og-image.jpg | _TODO: create image_ |
| Author | Angelina Huang | _(confirm)_ |
| Contact email | contact@angelina007.com | _TODO: confirm_ |

---

## 8. Asset Checklist

Before launch, ensure you have:

- [ ] Favicon (`.ico` + PNG variants)
- [ ] OG share image (1200x630)
- [ ] Profile photo (square, min 400x400)
- [ ] Resume PDF
- [ ] At least 3 project thumbnails (16:9, min 800x450)
- [ ] Project hero images
- [ ] Real social media URLs in constants.ts
- [ ] Real bio text in placeholder-data.ts
- [ ] Sanity Studio configured (or placeholder data updated)

### File Organization

```
public/
├── images/
│   ├── logo.svg          (optional, currently text-based)
│   ├── og-default.jpg
│   ├── profile.jpg
│   └── projects/
│       ├── project-slug-thumb.jpg
│       ├── project-slug-hero.jpg
│       └── ...
├── files/
│   └── resume.pdf
├── favicon.ico
└── robots.txt
```

---

## Next Steps

1. Fill in all `_TODO` fields in this guide
2. Gather image/file assets listed in section 8
3. Update `src/lib/placeholder-data.ts` with real content (or connect Sanity CMS)
4. Update `src/lib/constants.ts` with real social links and metadata
5. Run `npm run build` to verify everything compiles
