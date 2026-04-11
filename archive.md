# Archive — angelina007.com

Supplementary material that doesn't belong in `README.md` or `DesignDoc.md`: the Chinese (中文) version of the development guide, the content-preparation checklist used while populating the site, and notes about placeholder data and historical design decisions.

---

## 1. Content Preparation Checklist

Use this while gathering real copy, images, and links before launch. It is the single source of truth for what needs to go into Sanity or `src/lib/placeholder-data.ts`.

### 1.1 Branding assets

| Item | Spec | Location |
|------|------|----------|
| Logo (optional) | SVG, transparent background | `public/images/logo.svg` |
| Favicon | 512×512 PNG + `.ico` | `public/favicon.ico` + `public/images/icon-512.png` |
| Default OG image | 1200×630 JPG | `public/images/og-default.jpg` |
| Profile photo | square, min 400×400 | `public/images/profile.jpg` |
| Resume | PDF | `public/files/resume.pdf` |

Current logo is text-based: `A.` rendered in the accent color with `font-light tracking-widest`.

### 1.2 Home page

- **Name:** Angelina Huang
- **Tagline:** Computing × Art
- **Intro placeholder:** "A creative technologist exploring the intersection of code and artistic expression. From machine learning and graphics programming to interactive experiences."
- **CTAs:** `View Portfolio`, `Read Blog`
- **Featured projects:** 3 cards, each needs name, one-line description, category, 16:9 thumbnail, and optional links.

### 1.3 Portfolio project template

```
Project Name:
Slug:                 (url-friendly, e.g. neural-art-generator)
Category:             [ml-ai / graphics / game-dev / web / tools]
Thumbnail:            (16:9, min 800×450)
Hero image:           (wider banner for detail page)
Short description:    (1–2 sentences for the grid card)
Full description:     (multiple paragraphs, Portable Text)
Tech stack:           [Python, TensorFlow, React, ...]
Date:                 YYYY-MM-DD
Status:               [completed / in-progress / archived]
Demo URL:
GitHub URL:
Related blog slug:
Gallery images:       (optional)
Featured:             true/false   (home page eligibility)
```

### 1.4 About page

- **Bio:** 3–5 paragraphs on background, motivation, intersection of computing and art, and current focus.
- **Skills (placeholder groups):**
  - Languages — Python, C++, JavaScript, TypeScript, GLSL, GDScript, Rust
  - Frontend — React, Next.js, Tailwind CSS, Framer Motion, Three.js, Canvas API, WebGL
  - Graphics & Game Dev — WebGL, GLSL, Three.js, Godot, Unreal Engine, Blender, Aseprite
  - Machine Learning — TensorFlow, PyTorch, Keras, scikit-learn, Neural Networks, Computer Vision, NLP
  - Backend & Database — Node.js, Express, PostgreSQL, MongoDB, Firebase, REST APIs, GraphQL
  - Tools & Platforms — Git, Docker, AWS, Vercel, GitHub, VS Code, Figma
- **Timeline placeholder:**

| Year | Event |
|------|-------|
| 2024 | AI Art Exploration |
| 2023 | Graphics Programming |
| 2022 | Full-Stack Development |
| 2021 | Game Development Experiments |
| 2020 | Started Creative Coding |

### 1.5 Blog

- Plan the first 3 posts up front so Sanity categories and tags can be created in advance.
- Portable Text features to enable: code blocks (sugar-high highlighting), image galleries, video embeds (YouTube/Bilibili), optional KaTeX and interactive playgrounds.

### 1.6 Social links (`src/lib/constants.ts → SOCIAL_LINKS`)

Current placeholders that need real URLs before launch:

| Platform | Placeholder |
|----------|-------------|
| GitHub | https://github.com/angelina007 |
| Bilibili | https://www.bilibili.com/angelina007 |
| YouTube | https://www.youtube.com/@angelina007 |
| Instagram | https://instagram.com/angelina007 |
| ArtStation | https://www.artstation.com/angelina007 |
| Twitter | https://twitter.com/angelina007 |
| LinkedIn | https://linkedin.com/in/angelina007 |
| Email | contact@angelina007.com |

### 1.7 Asset directory layout

```
public/
├── images/
│   ├── logo.svg                (optional, currently text-based)
│   ├── og-default.jpg
│   ├── profile.jpg
│   └── projects/
│       ├── <slug>-thumb.jpg
│       ├── <slug>-hero.jpg
│       └── ...
├── files/
│   └── resume.pdf
├── favicon.ico
└── robots.txt
```

### 1.8 Launch checklist

- [ ] Favicon (`.ico` + PNG variants)
- [ ] OG share image (1200×630)
- [ ] Profile photo (square, min 400×400)
- [ ] Resume PDF in `public/files/`
- [ ] At least 3 project thumbnails (16:9, min 800×450)
- [ ] Project hero images
- [ ] Real social URLs in `src/lib/constants.ts`
- [ ] Real bio text in `src/lib/placeholder-data.ts` (or Sanity)
- [ ] Sanity Studio configured, or placeholder data fully populated
- [ ] `npm run build` succeeds with no warnings

---

## 2. Placeholder Data Reference

When Sanity env vars are missing, the site reads from `src/lib/placeholder-data.ts`. Keep its shape in sync with the Sanity schemas in `sanity/schemas/` so that swapping in live CMS data is a drop-in change. The recommended pattern is to export:

- `placeholderPosts` matching the `post` schema shape
- `placeholderProjects` matching the `project` schema shape
- `placeholderCategories` matching the `category` schema shape
- `placeholderAuthor` for single-author fields

Each Sanity query helper in `src/lib/sanity/client.ts` should fall back to the corresponding placeholder when the client cannot be constructed.

---

## 3. 开发指南（中文版）

Angelina Huang 的个人作品集与博客网站 — 一个在计算机与视觉艺术交叉领域工作的开发者和艺术家。

### 3.1 项目目标

- 一个专业、精致的个人网站，作为所有线上存在的中心枢纽
- 针对所有屏幕尺寸、浏览器、操作系统和平台（桌面、平板、手机）做优化
- 易于维护 — 尤其是博客内容，应该能在任何设备上编辑，包括手机
- 快速加载、强 SEO、无障碍合规
- 支持深色/浅色主题切换

### 3.2 技术栈

| 层级 | 技术 | 选型理由 |
|------|------|----------|
| 框架 | Next.js 14（App Router） | SSR/SSG 混合渲染，性能优秀，自带图片优化，SEO 友好 |
| 样式 | Tailwind CSS | 原子化 CSS，响应式设计内置，深色/浅色主题切换简单 |
| 动画 | Framer Motion + Canvas 2D | UI 用 Framer Motion，首页背景用原生 Canvas |
| CMS | Sanity.io | 无头 CMS，移动端友好的编辑界面，免费额度充足，实时预览 |
| 语言 | TypeScript | 整个前端的类型安全 |
| 部署 | Docker + Digital Ocean | 容器化部署到现有的 DO 基础设施 |
| CI/CD | GitHub Actions | push 到 main 自动构建和部署 |
| 数据分析 | Plausible / Umami / GA4 | 隐私友好，可切换 |

**为什么用 Sanity 而不是 Markdown 文件或 Django admin：** Sanity 提供托管的编辑工作台，在手机浏览器上也能很好地使用。你可以在手机上写文章、编辑和发布博客，不需要 git、终端或电脑。免费额度很慷慨（每月 10 万次 API 请求），内置实时内容预览和图片优化。不需要维护后端服务器来管理内容。

**为什么不用 Django 后端：** 对于个人作品集 + 博客来说，完整的 Django 后端增加了运维复杂度（数据库迁移、服务器维护、安全补丁），收益不大。Sanity 处理内容管理，Next.js 处理渲染。如果以后需要服务端逻辑（联系表单、邮件订阅），Next.js API Routes 或 Serverless Functions 足够用。

**为什么不用 Notion 作为 CMS：** Notion API 有速率限制和缓存问题，用于生产环境不够稳定。

### 3.3 页面与功能

- **首页 `/`**：Hero 区域（姓名、标语、简介）、动画背景、精选项目网格（3–4 个）、最新博客预览（2–3 篇）、跳转链接与社交栏。
- **作品集 `/portfolio`**：可按类别筛选的作品网格（游戏开发、图形/Shader、ML/AI、Web、工具），每个项目显示缩略图、标题、技术栈标签、简短描述。
- **项目详情 `/portfolio/[slug]`**：Hero 图或嵌入视频、描述、技术栈、图库、Demo/GitHub 链接、相关博客。
- **博客 `/blog`**：列表视图，含标题、日期、阅读时间、标签、预览图；分类筛选；分页或无限滚动。
- **博客文章 `/blog/[slug]`**：完整富文本，代码高亮，自动生成目录，阅读进度条，相关文章。
- **关于 `/about`**：详细个人简介、技能分组、时间线、简历下载、头像。
- **联系 `/contact`**：联系表单、社交链接、邮箱（防爬）、可选 Calendly 嵌入。

### 3.4 主题系统

- 默认跟随系统偏好（`prefers-color-scheme`）
- 手动切换开关，偏好持久化存储（localStorage）
- 主题切换时平滑过渡（CSS transition 作用于 `background-color`、`color`）
- 所有组件必须在两种主题下都经过测试

配色：

- **深色主题：** 背景 `#0f0f14` → `#1a1b27`，文字 `#e4e4e7` / `#a1a1aa`，强调色 `#6366f1`（靛蓝）
- **浅色主题：** 背景 `#ffffff` → `#f4f4f5`，文字 `#18181b` / `#52525b`，强调色 `#b45309`（暖橙）

字体：Space Mono（主要）、Space Grotesk（长文本，字重 300）、JetBrains Mono（代码）。

### 3.5 响应式与无障碍

断点（xs < 480 / sm 480–639 / md 640–767 / lg 768–1023 / xl 1024–1279 / 2xl ≥ 1280）、iOS Safari 安全区、触摸目标 ≥ 44px、键盘导航、WCAG 2.1 AA、`prefers-reduced-motion` 支持。性能目标：Lighthouse 各项 ≥ 95，FCP < 1.2s，LCP < 2.0s，CLS < 0.05，TTI < 2.5s。

### 3.6 部署架构

```
GitHub（push 到 main）
  → GitHub Actions（构建 + 推送 Docker 镜像）
    → Digital Ocean Droplet
      → Docker Compose
        ├── Next.js 容器（Node.js，端口 3000）
        ├── Nginx 容器（反向代理，SSL，端口 80/443）
        └── Certbot（Let's Encrypt 证书自动续期）
```

域名通过 A 记录指向 droplet IP，SSL 由 Let's Encrypt 签发并每 12 小时续期一次。

### 3.7 开发流程

```bash
# 本地开发
npm install && npm run dev

# Docker 本地开发
docker compose -f docker-compose.dev.yml up

# Sanity Studio（博客编辑）
cd sanity && npm install && npm run dev   # http://localhost:3333

# 生产构建测试
docker compose up --build

# 部署
git push origin main
```

### 3.8 里程碑

1. **M1 基础搭建** — 项目初始化、布局、导航栏、页脚、主题切换、响应式骨架
2. **M2 首页** — Hero 区域、精选项目、最新文章、Canvas 背景
3. **M3 作品集** — 项目网格、筛选、详情页、Sanity 项目 schema
4. **M4 博客** — Sanity 集成、博客列表、文章页、代码高亮、目录
5. **M5 关于 + 联系** — 个人简介页、联系表单、简历下载
6. **M6 打磨** — 动画、加载状态、错误页面、404
7. **M7 SEO + 性能** — Meta 标签、Sitemap、Lighthouse 优化
8. **M8 部署** — Docker 配置、GitHub Actions、Digital Ocean、SSL、域名
9. **M9 数据分析 + 监控** — Umami/Plausible 部署、运行时间监控

---

## 4. Historical Notes

- Earlier iterations considered a full Django backend (which was running on the droplet before this rewrite). It was removed in favor of Next.js + Sanity to cut operational complexity. The deployment runbook in `DesignDoc.md` includes a step for tearing down the old Django services.
- Blog content was briefly prototyped with local Markdown files before switching to Sanity for mobile editability.
- The "cat chasing the cursor" interaction in light mode is intentional personality and should be preserved in any redesign — it's part of the brand.

---

## 5. Suggested Additional Documents (not yet created)

If the project grows, consider adding:

- `CONTRIBUTING.md` — if the repo ever takes outside contributions.
- `CHANGELOG.md` — user-facing changelog once the site has a public audience.
- `SECURITY.md` — how to report a vulnerability.
- `docs/schemas/` — exported Sanity schema JSON for tooling.
- A dedicated brand/style guide PDF once the visual language is finalized.

Let me know if any of these are worth creating now.
