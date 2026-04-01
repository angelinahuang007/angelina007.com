# angelina007.com

Angelina Huang 的个人作品集与博客网站 — 一个在计算机与视觉艺术交叉领域工作的开发者和艺术家。

## 1. 项目目标

- 一个专业、精致的个人网站，作为所有线上存在的中心枢纽
- 针对所有屏幕尺寸、浏览器、操作系统和平台（桌面、平板、手机）做优化
- 易于维护 — 尤其是博客内容，应该能在任何设备上编辑，包括手机
- 快速加载、强 SEO、无障碍合规
- 支持深色/浅色主题切换

## 2. 技术栈

### 推荐架构

| 层级 | 技术 | 选型理由 |
|------|------|----------|
| 框架 | **Next.js 14+（App Router）** | SSR/SSG 混合渲染，性能优秀，自带图片优化，SEO 友好 |
| 样式 | **Tailwind CSS** | 原子化 CSS，响应式设计内置，深色/浅色主题切换简单 |
| 动画 | **Framer Motion** | 轻量高性能动画，用于页面过渡和滚动效果 |
| 内容 CMS | **Sanity.io** | 无头 CMS，移动端友好的编辑界面，免费额度，实时预览。管理所有内容：博客文章、作品集项目和关于页面 |
| 语言 | **TypeScript** | 整个前端的类型安全 |
| 部署 | **Docker + Digital Ocean** | 容器化部署到现有的 DO 基础设施 |
| CI/CD | **GitHub Actions** | push 到 main 自动构建和部署 |
| 数据分析 | **Plausible 或 Umami** | 隐私友好，可自托管的分析工具 |

### 为什么选这套技术栈

**为什么用 Sanity 而不是 Markdown 文件或 Django admin：**
Sanity 提供托管的编辑工作台（studio.angelina007.com），在手机浏览器上也能很好地使用。你可以在手机上写文章、编辑和发布博客，不需要 git、终端或电脑。免费额度很慷慨（每月 10 万次 API 请求），内置实时内容预览和图片优化。不需要维护后端服务器来管理内容。

**为什么不用 Django 后端：**
对于个人作品集 + 博客来说，完整的 Django 后端增加了运维复杂度（数据库迁移、服务器维护、安全补丁），收益不大。Sanity 处理内容管理，Next.js 处理渲染。如果以后需要服务端逻辑（联系表单、邮件订阅），Next.js API Routes 或 Serverless Functions 足够用。

**为什么不用 Notion 作为 CMS：**
Notion API 有速率限制和缓存问题，用于生产环境不够稳定。Sanity 是为这个场景专门设计的。

## 3. 页面与功能

### 3.1 首页（`/`）

- Hero 区域：姓名、标语（"Computing x Art"）、简介
- 动画背景或微妙的视觉元素，体现艺术 + 技术的定位
- 精选项目网格（3-4 个重点作品）
- 最新博客预览（2-3 篇近期文章）
- 跳转链接：作品集、博客、联系方式
- 社交媒体链接栏

### 3.2 作品集（`/portfolio`）

- 可筛选的作品网格，按类别分：游戏开发、图形/Shader、ML/AI、Web、工具
- 每个项目显示：缩略图、标题、技术栈标签、简短描述
- 点击展开到完整项目详情页

### 3.3 项目详情（`/portfolio/[slug]`）

- Hero 图片或嵌入式视频/Demo
- 项目描述、目标和成果
- 技术栈拆解
- 图片画廊或视频演示
- 链接：在线 Demo、GitHub 仓库、相关博客

### 3.4 博客（`/blog`）

- 列表视图：标题、日期、阅读时间、标签、预览图
- 分类/标签筛选
- 搜索功能
- 分页或无限滚动

### 3.5 博客文章（`/blog/[slug]`）

- 完整文章，支持富文本格式（代码块语法高亮、图片、嵌入内容）
- 目录（根据标题自动生成）
- 阅读进度指示器
- 底部相关文章推荐
- 分享按钮

### 3.6 关于（`/about`）

- 详细个人简介与职业背景
- 技能/工具可视化
- 时间线或里程碑
- 简历下载（PDF）
- 个人照片

### 3.7 联系（`/contact`）

- 联系表单（姓名、邮箱、主题、留言）
- 社交媒体链接
- 邮箱地址（带防垃圾邮件保护）
- 可选：Calendly 嵌入，方便预约通话

## 4. 跨平台与响应式要求

### 4.1 断点

| 断点 | 宽度 | 目标设备 |
|------|------|----------|
| xs | < 480px | 小屏手机 |
| sm | 480-639px | 大屏手机 |
| md | 640-767px | 小平板 |
| lg | 768-1023px | 平板 / 小笔记本 |
| xl | 1024-1279px | 笔记本 |
| 2xl | >= 1280px | 台式机 / 大屏 |

### 4.2 浏览器支持

- Chrome（最新 2 个版本）
- Firefox（最新 2 个版本）
- Safari（最新 2 个版本，包括 iOS Safari）
- Edge（最新 2 个版本）
- Samsung Internet（最新版）

### 4.3 平台特殊考虑

- **iOS Safari：** 刘海/灵动岛安全区域适配、100vh 修复、触摸目标 >= 44px
- **Android Chrome：** Material 风格滚动、viewport meta 标签、PWA-ready manifest
- **桌面端：** hover 状态、键盘导航、焦点指示器
- **无障碍：** WCAG 2.1 AA 合规、语义化 HTML、ARIA 标签、alt 文本、跳过链接、减弱动画支持

### 4.4 性能指标

| 指标 | 目标 |
|------|------|
| Lighthouse 性能分 | >= 95 |
| Lighthouse 无障碍分 | >= 95 |
| Lighthouse SEO 分 | >= 95 |
| 首次内容绘制（FCP） | < 1.2s |
| 最大内容绘制（LCP） | < 2.0s |
| 累积布局偏移（CLS） | < 0.05 |
| 可交互时间（TTI） | < 2.5s |

## 5. 主题系统

### 5.1 深色/浅色模式

- 默认跟随系统偏好（`prefers-color-scheme`）
- 手动切换开关，偏好持久化存储（localStorage）
- 主题切换时平滑过渡（CSS transition 作用于 `background-color`、`color`）
- 所有组件必须在两种主题下都经过测试

### 5.2 配色方案（参考）

**深色主题：**
- 背景：`#0f0f14` → `#1a1b27`
- 文字：`#e4e4e7`（主要）、`#a1a1aa`（次要）
- 强调色：`#6366f1`（靛蓝）、`#38bdf8`（天蓝）

**浅色主题：**
- 背景：`#ffffff` → `#f4f4f5`
- 文字：`#18181b`（主要）、`#52525b`（次要）
- 强调色：`#4f46e5`（靛蓝）、`#0ea5e9`（天蓝）

## 6. 项目结构

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
│   │   ├── layout.tsx            # 根布局（主题提供者、导航栏、页脚）
│   │   ├── page.tsx              # 首页
│   │   ├── portfolio/
│   │   │   ├── page.tsx          # 作品集网格
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # 项目详情
│   │   ├── blog/
│   │   │   ├── page.tsx          # 博客列表
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # 博客文章
│   │   ├── about/
│   │   │   └── page.tsx
│   │   └── contact/
│   │       └── page.tsx
│   ├── components/
│   │   ├── layout/               # 导航栏、页脚、主题切换
│   │   ├── ui/                   # 按钮、卡片、标签等
│   │   ├── home/                 # Hero、精选项目、最新文章
│   │   ├── portfolio/            # 项目网格、项目卡片、筛选栏
│   │   ├── blog/                 # 文章列表、文章卡片、目录
│   │   └── shared/               # SEO Head、图片回退、加载动画
│   ├── lib/
│   │   ├── sanity/               # Sanity 客户端、查询、类型
│   │   ├── utils.ts              # 工具函数
│   │   └── constants.ts          # 网站元数据、导航链接、社交链接
│   ├── styles/
│   │   └── globals.css           # Tailwind 指令、CSS 自定义属性
│   ├── types/
│   │   └── index.ts              # 共享 TypeScript 类型
│   └── hooks/
│       └── index.ts              # 自定义 React hooks
├── sanity/
│   ├── schemas/                  # 博客文章、分类、作者的 schema
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

## 7. 部署架构

```
GitHub（push 到 main）
  → GitHub Actions（构建 + 推送 Docker 镜像）
    → Digital Ocean Droplet
      → Docker Compose
        ├── Next.js 容器（Node.js，端口 3000）
        ├── Nginx 容器（反向代理，SSL，端口 80/443）
        └──（可选）Umami 容器（数据分析）

域名：angelina007.com
DNS：Digital Ocean → Droplet IP
SSL：Let's Encrypt + Certbot（自动续期）
CDN：Cloudflare（可选，用于缓存和 DDoS 防护）
```

## 8. SEO 策略

- 通过 Next.js Metadata API 为每个页面设置动态 `<title>` 和 `<meta description>`
- Open Graph 和 Twitter Card meta 标签，用于社交分享
- 结构化数据（JSON-LD）：Person、BlogPosting、WebSite schema
- 自动生成 `sitemap.xml` 和 `robots.txt`
- Canonical URL 防止重复内容
- 所有图片添加 alt 文本
- 语义化 HTML 结构（h1-h6 层级、landmark roles）

## 9. 开发流程

```bash
# 本地开发
docker compose -f docker-compose.dev.yml up

# 不用 Docker 也可以
cd src && npm install && npm run dev

# Sanity Studio（博客编辑）
cd sanity && npm run dev
# 在 http://localhost:3333 打开

# 生产构建测试
docker compose up --build

# 部署（push 到 main 后通过 GitHub Actions 自动执行）
git push origin main
```

## 10. 里程碑

- [ ] **M1：基础搭建** — 项目初始化、布局、导航栏、页脚、主题切换、响应式骨架
- [ ] **M2：首页** — Hero 区域、精选项目、最新文章区块
- [ ] **M3：作品集** — 项目网格、筛选、详情页（Sanity 内容）
- [ ] **M4：博客** — Sanity 集成、博客列表、文章页、代码高亮
- [ ] **M5：关于 + 联系** — 个人简介页、联系表单、简历下载
- [ ] **M6：打磨** — 动画、加载状态、错误页面、404
- [ ] **M7：SEO + 性能** — Meta 标签、Sitemap、Lighthouse 优化
- [ ] **M8：部署** — Docker 配置、GitHub Actions、Digital Ocean、SSL、域名
- [ ] **M9：数据分析 + 监控** — Umami/Plausible 部署、运行时间监控
