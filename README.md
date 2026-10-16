# angelina007.com

Personal portfolio and blog for **Angelina Huang** — a creative technologist working at the intersection of computing and art.

Live at [angelina007.com](https://angelina007.com)

## Overview

A responsive portfolio and blog with an interactive 3D home page: a sunlit creative attic and a blue robotics lab after hours. The existing projects, services, blog, contact routes, site theme, and Sanity CMS remain available below and alongside the scene.

## Tech Stack

- **Framework:** Next.js 14 (App Router, SSR/SSG hybrid)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom theme tokens
- **Fonts:** Space Mono, Space Grotesk, JetBrains Mono (via `next/font/google`)
- **3D:** Three.js, detailed local geometry, offline lightmap atlases and vertex lighting/AO, spatially batched Meshopt GLBs and canvas artwork textures
- **Animation:** On-demand camera rendering, Framer Motion for UI transitions
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
│   ├── home/        Hero, RoomCanvas, scene builders/controls, FeaturedProjects, LatestPosts
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

Server-side image optimization is temporarily disabled (`images.unoptimized`) to close the affected image endpoint described in [GHSA-2xp9-vwfh-vxw4](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4). Images use their original files, which can increase image transfer sizes; the baked 3D assets are unaffected. Re-enable optimization only after upgrading and verifying Next.js and its image-decoding dependencies.

## Interactive home scene

The rooms are real meshes. `src/components/home/scene/studio.ts`, `lab.ts`, and `lab-detail.ts` define editable geometry using `kit.ts`. Wood grain, fabric weave, the rug, screens, and distant window illustrations use small reusable canvas textures. The main lab arm has its own cast fork, tapered forearm and drive housings; the north studio cushions, curtain and throw have dedicated sewn/draped surfaces.

`scripts/bake-rooms.mjs` ray-traces static area/sun lighting and ambient occlusion against a BVH offline. Hooded Lab fixtures use directional cones with soft edges to bake local pools of light; their directions and origins match the authored fixtures. `scripts/room-lightmaps.mjs` unwraps large planar architecture into padded 2048px color/light atlases. Wood is filtered in linear color to the atlas texel footprint to avoid aliasing. Complex curved surfaces retain baked vertex colors; emissive panels retain authored colors. A simple material-dependent sheen is also baked for the fixed viewing position. This is an art-directed approximation, not a full PBR/GI solver. Batches are split into eight spatial sectors so frustum culling can omit geometry behind the viewer. The browser loads the Meshopt-compressed unlit GLBs; no model construction, light baking or realtime lighting runs on a visitor's device.

- Each visit starts in Auto: Studio/light from 07:00 to 19:00 in the visitor's local time, and Lab/dark otherwise. The navigation's sun/moon icon switches both the room and the site theme. A manual choice stays active during site navigation; refreshing returns to Auto. The navigation floats transparently over the scene, without a separate room label or room switcher.
- On a computer, click the room to start following the mouse position, without holding a button. Click again, press Escape, leave the canvas, or scroll to stop. Entering this mode keeps the current view; mouse movement eases to the new angle and rendering stops when it settles. Focus the canvas and use A/D to turn or W/S to look up/down. The scene has no persistent direction, reset or controls toolbar.
- Touch keeps vertical page scrolling and uses horizontal swipes to turn. On supported phones over HTTPS, a short hint invites a tap on the room to request sensor access. Only a completed tap triggers the permission prompt; dragging or scrolling does not. Granted access carries across room switches in the current page. Physical-device sensor testing requires trusted HTTPS and a supported browser; a LAN HTTP address supports dragging but cannot enable tilt.
- No continuous idle animation, realtime lights/shadows, or postprocessing. Lighting and contact shadows are baked into the assets. Rendering pauses while idle, offscreen, or hidden. Drawing resolution is capped at 2.1 million pixels, with DPR capped at 1.5 desktop / 1.25 mobile. Each room asset loads only when selected. File size, total triangles and maximum batch count are recorded beside each GLB; submitted geometry varies with viewing direction. Download compression and GPU memory are separate budgets.
- Leaving the page or switching rooms disposes geometry, textures, renderer, input listeners, observers, and pending frames. A failed WebGL context shows a retry and ordinary portfolio links.

The rooms follow the selected Lab 03 and revised Studio 02 art direction. The concept image files are not downloaded by the homepage. After changing a model or bake lighting, run `npm run bake:rooms` (or append `-- studio` / `-- lab`) and refresh the preview. Commit the generated GLB and JSON files together with their source changes. `npm run dev` previews the website; `npm run build` validates the production bundle. Deployment serves the prebuilt assets and does not rerun the bake. Use Node 20.19+ (the Docker build uses Node 20).

Non-atlas textured materials encode a wider lighting range in 8-bit vertex colors using a `bakedLightScale` material extra. The viewer restores that multiplier once per material; standalone GLB viewers that ignore the extra will show those surfaces too dark. This retains sunlight intensity on curved wood and fabric without runtime lighting calculations. Atlas colors already include their lighting and do not use this multiplier. Hidden outward box faces and static highlights assume the existing stationary camera; changing its position requires rebaking. Turning the view does not.

### Mobile quality and validation

The current target device is iPhone 16. A desktop viewport check is not an iPhone performance test: sustained turning, Safari memory pressure, thermals, gyro permission and touch behavior still need physical-device validation. The scene is deliberately static so idle frames can stop completely. The renderer keeps inspectable canvas data for drawing-buffer dimensions, submitted triangles, decoded geometry bytes and estimated texture storage including mip levels. Texture estimates exclude driver overhead and CPU image copies.

When WebGL2 GPU timers are available, sustained measured GPU work over 30ms **and** interaction intervals over 40ms can reduce resolution from 1.0 to 0.85 to 0.72, with warmup and cooldown. A 30fps cap or slow CPU alone does not trigger this. Unsupported or invalid GPU timers provide no automatic downgrade. Rendering is never kept alive just to collect diagnostics.

Sources reviewed for the mobile-quality revision:

- [miHoYo / Unity Japan — From Mobile to Console (2021)](https://www.slideshare.net/slideshow/210617-unity-dojo20211mihoyozhenzhongyi/249437133): explicitly distinguishes mobile and PC/console pipelines. Its later advanced shadow, AO and reflection techniques describe **console** rendering; they are not evidence of the mobile implementation.
- [GDC — Crafting an Anime Style Open World (2021)](https://www.gdcvault.com/play/1027539): the official talk overview emphasizes composition, artistic expression and production workflow. The hosted PDF was unavailable during this review; no unverified slide details are assumed.
- [Unity — Mobile graphics and assets optimization](https://unity.com/blog/games/optimize-your-mobile-game-performance-expert-tips-on-graphics-and-assets): general guidance on asset detail, batching, texture memory, resolution and profiling. These general recommendations are not attributed to Genshin's private mobile engine.
- [Android Developers — Lighting for mobile games](https://developer.android.com/games/optimize/lighting-for-mobile-games-with-unity): supports baking static lighting and budgeting lightmap memory. Our two fixed lighting states are a project-specific reason to bake; Genshin's dynamic open world has different needs.

The current implementation is a quality iteration on the selected concepts, not a claim of Genshin-equivalent art or measured iPhone frame rates. Remaining visual work should prioritize purpose-built silhouettes, controlled material scale and dedicated UV assets for prominent props; additional primitive counts do not establish quality parity.

## Documentation

- [DesignDoc.md](DesignDoc.md) — full technical spec: architecture, pages, components, theme system, Sanity schemas, deployment, runbook, and SEO strategy. This is the document to read if you want to understand or rebuild the site.
- [archive.md](archive.md) — supplementary material: Chinese (中文) development guide, content preparation checklist, placeholder-data reference, and historical notes.

## License

All rights reserved. This is a personal portfolio site.
