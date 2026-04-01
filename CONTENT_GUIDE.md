# angelina007.com — 初始内容填充指南 / Content Guide

This document helps you prepare all the content needed to build the first version of your website. Fill in each section, and gather the referenced assets. This will be the single source of truth for the initial site generation.

本文档帮助你准备建站所需的所有初始内容。请填写每个部分并准备好相关素材。

---

## 1. Branding / 品牌素材

### 1.1 Logo

| Item | Description | File Location |
|------|-------------|---------------|
| Primary logo (SVG) | Vector logo for nav bar and favicon. Transparent background. | `public/images/logo.svg` |
| Favicon (PNG) | 512×512 square version for browser tab / PWA icon | `public/favicon.ico` + `public/images/icon-512.png` |
| OG Image | 1200×630 default social share image (used when no page-specific image) | `public/images/og-default.jpg` |

**Your logo:**
> _TODO: Describe your logo or attach file. Do you have an existing logo, or should one be designed?_

### 1.2 Color Palette

The README already defines a color palette. Confirm or adjust here:

- Dark background: `#0f0f14` → `#1a1b27`
- Light background: `#ffffff` → `#f4f4f5`
- Accent primary (indigo): `#6366f1` / `#4f46e5`
- Accent secondary (sky blue): `#38bdf8` / `#0ea5e9`

**Adjustments:**
> _TODO: Any changes to the palette?_

### 1.3 Typography

Recommended: Inter (body) + JetBrains Mono (code). Stored in `public/fonts/` or loaded from Google Fonts.

**Your preference:**
> _TODO: Confirm or suggest alternative fonts._

---

## 2. Home Page / 首页内容

### 2.1 Hero Section

| Field | Content |
|-------|---------|
| Name | Angelina Huang |
| Tagline | _TODO: e.g. "Computing × Art"_ |
| Short intro (1–2 sentences) | _TODO: A one-liner about who you are and what you do_ |
| Hero background | _TODO: Animated shader? Particle effect? Subtle gradient? Describe the vibe you want._ |

### 2.2 Featured Projects (3–4)

These will appear as cards on the home page. Pick your best/most representative works.

| # | Project Name | One-line Description | Thumbnail Image | Link |
|---|-------------|---------------------|-----------------|------|
| 1 | _TODO_ | _TODO_ | `public/images/projects/xxx.jpg` | _TODO: GitHub / live demo_ |
| 2 | _TODO_ | _TODO_ | `public/images/projects/xxx.jpg` | _TODO_ |
| 3 | _TODO_ | _TODO_ | `public/images/projects/xxx.jpg` | _TODO_ |
| 4 | _TODO_ (optional) | _TODO_ | `public/images/projects/xxx.jpg` | _TODO_ |

---

## 3. Portfolio / 作品集

All portfolio projects will be managed in Sanity. For each project, prepare the following:

### Project Template (copy for each project)

```
Project Name:
Category: [Game Dev / Graphics & Shaders / ML & AI / Web / Tools]
Thumbnail: (16:9, min 800×450)
Hero Image or Video: (URL or file)
Short Description: (1–2 sentences, shown in grid)
Full Description: (detailed write-up, can include multiple paragraphs)
Tech Stack: [e.g. Unity, HLSL, Python, ...]
Date: YYYY-MM
Status: [Completed / In Progress / Archived]
Links:
  - Live Demo:
  - GitHub:
  - Related Blog Post:
Gallery Images: (list of image files)
```

### Your Projects:

> _TODO: List all projects you want on the site at launch. Use the template above for each one. Thumbnail and hero images go in `public/images/projects/`._

**Project 1:**
```
Project Name:
Category:
...
```

**Project 2:**
```
Project Name:
Category:
...
```

_(Add more as needed)_

---

## 4. About Page / 关于页面

### 4.1 Profile Photo

| Item | Spec | File Location |
|------|------|---------------|
| Profile photo | Square, min 400×400, professional/artistic | `public/images/profile.jpg` |

### 4.2 Bio

> _TODO: Write your extended bio (3–5 paragraphs). Cover your background, what drives you, your intersection of computing and art, and what you're working on now._

### 4.3 Skills & Tools

List the tools/technologies you want displayed, grouped by category:

| Category | Tools |
|----------|-------|
| Languages | _TODO: e.g. Python, C++, HLSL, GLSL, TypeScript_ |
| Game Engines | _TODO: e.g. Unity, Unreal Engine_ |
| DCC Tools | _TODO: e.g. Houdini, Blender, Substance, Maya_ |
| ML/AI | _TODO: e.g. PyTorch, TensorFlow, YOLO_ |
| Web | _TODO: e.g. React, Next.js, Three.js_ |
| Other | _TODO: e.g. Docker, Git, Linux_ |

### 4.4 Timeline / Milestones

> _TODO: Key career/education milestones in chronological order. These will be displayed as a visual timeline._

| Year | Event |
|------|-------|
| _TODO_ | _TODO: e.g. Started CS degree at XXX University_ |
| _TODO_ | _TODO: e.g. First game jam, published XXX_ |
| _TODO_ | _TODO: e.g. Joined XXX company as Technical Artist_ |

### 4.5 Resume

| Item | File Location |
|------|---------------|
| Resume PDF | `public/files/resume.pdf` |

---

## 5. Blog / 博客

Blog posts are managed entirely in Sanity Studio. No files needed here, but plan your first few posts:

### Initial Blog Posts (optional but recommended)

> _TODO: List 1–3 blog post ideas for launch. Having content at launch makes the site feel alive._

| # | Title Idea | Topic | Draft Ready? |
|---|-----------|-------|-------------|
| 1 | _TODO_ | _TODO_ | Yes / No |
| 2 | _TODO_ | _TODO_ | Yes / No |
| 3 | _TODO_ | _TODO_ | Yes / No |

### Blog Content Features

Sanity Portable Text supports rich content via custom components. Plan which of these you'll need for your blog:

- [x] Code blocks with syntax highlighting (built-in)
- [ ] Shader/WebGL live demos (custom component — Three.js or raw WebGL embed)
- [ ] Interactive code playgrounds (custom component)
- [ ] Math equations (KaTeX integration)
- [ ] Video embeds (YouTube, Bilibili)
- [ ] Image galleries
- [ ] Before/after comparison sliders

> _TODO: Check the ones you want available at launch._

---

## 6. Contact Page / 联系页面

### 6.1 Social Links

| Platform | URL | Username |
|----------|-----|----------|
| GitHub | https://github.com/angelinahuang007 | angelinahuang007 |
| Bilibili | _TODO_ | _TODO_ |
| YouTube | _TODO_ | _TODO_ |
| Instagram | _TODO_ | _TODO_ |
| ArtStation | _TODO_ | _TODO_ |
| Twitter/X | _TODO_ | _TODO_ |
| LinkedIn | _TODO_ | _TODO_ |
| Email | _TODO: public contact email_ | — |

### 6.2 Contact Form

The contact form will send submissions via email. Which email should receive form submissions?

> _TODO: Contact form destination email_

### 6.3 Calendly (optional)

> _TODO: If you want a meeting scheduler embedded, provide your Calendly link. Otherwise leave blank._

---

## 7. SEO & Metadata / SEO 元数据

| Field | Content |
|-------|---------|
| Site title | _TODO: e.g. "Angelina Huang — Computing × Art"_ |
| Site description (150 chars) | _TODO: Used in search results and social cards_ |
| Keywords | _TODO: e.g. "technical art, shader, game dev, creative coding, computer graphics"_ |
| Google Analytics / Plausible ID | _TODO: if you have one_ |

---

## 8. Asset Checklist / 素材清单

Before we start building, make sure you have these ready:

- [ ] Logo (SVG + PNG favicon)
- [ ] OG share image (1200×630)
- [ ] Profile photo (square, min 400×400)
- [ ] Resume PDF
- [ ] At least 3 project thumbnails (16:9, min 800×450 each)
- [ ] Project hero images or videos
- [ ] Gallery images for projects (optional)
- [ ] Font files (if using custom fonts not on Google Fonts)

### File Organization

All static assets go in the `public/` directory:

```
public/
├── images/
│   ├── logo.svg
│   ├── og-default.jpg
│   ├── profile.jpg
│   └── projects/
│       ├── project-1-thumb.jpg
│       ├── project-1-hero.jpg
│       ├── project-1-gallery-1.jpg
│       └── ...
├── fonts/
│   └── (custom font files if any)
├── files/
│   └── resume.pdf
├── favicon.ico
└── robots.txt
```

Content managed in Sanity (not stored as files):
- Blog posts (text, images uploaded to Sanity CDN)
- Portfolio project details (descriptions, metadata)
- About page content (bio, timeline)

---

## Next Steps

1. Fill in all the `_TODO` fields above
2. Gather all image/file assets listed in section 8
3. Once this guide is filled in, we can scaffold the project and populate it with your content
