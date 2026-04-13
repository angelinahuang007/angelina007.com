const express = require('express');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { Marked } = require('marked');
const { markedHighlight } = require('marked-highlight');
const hljs = require('highlight.js');
const { glob } = require('glob');

const app = express();
const PORT = process.env.PORT || 4000;
const CONTENT_DIR = path.join(__dirname, 'content');

// Configure marked with syntax highlighting
const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    }
  })
);

marked.use({
  renderer: {
    heading(text, level, raw) {
      const plainText = (raw || text).replace(/<[^>]+>/g, '');
      const slug = plainText.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/(^-|-$)/g, '');
      return `<h${level} id="${slug}">${text}</h${level}>\n`;
    }
  }
});

// Serve static files
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/lib', express.static(path.join(__dirname, 'public/lib')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// ------- Helper: discover all articles -------
// Supports two formats:
//   1. Folder-based: content/category/slug/meta.json + index.html (interactive)
//   2. Legacy .md:   content/category/slug.md (markdown only)
async function discoverArticles() {
  const articles = [];

  // 1. Folder-based articles (meta.json)
  const metaFiles = await glob('**/meta.json', { cwd: CONTENT_DIR });
  for (const mf of metaFiles) {
    const dir = path.dirname(mf);
    const metaPath = path.join(CONTENT_DIR, mf);
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    const hasHtml = fs.existsSync(path.join(CONTENT_DIR, dir, 'index.html'));
    const hasReadme = fs.existsSync(path.join(CONTENT_DIR, dir, 'README.md'));

    articles.push({
      slug: dir,
      title: meta.title || dir,
      category: meta.category || dir.split('/').slice(0, -1).join('/') || dir,
      tags: meta.tags || [],
      description: meta.description || '',
      related: meta.related || [],
      order: meta.order || 999,
      icon: meta.icon || null,
      interactive: hasHtml,
      hasReadme,
    });
  }

  // 2. Legacy standalone .md files (not inside a folder with meta.json)
  const mdFiles = await glob('**/*.md', { cwd: CONTENT_DIR });
  for (const mf of mdFiles) {
    // Skip README.md inside article folders
    if (mf.endsWith('/README.md') || mf === 'README.md') continue;
    const slug = mf.replace(/\.md$/, '');
    // Skip if already discovered as folder-based
    if (articles.some(a => a.slug === slug)) continue;

    const fullPath = path.join(CONTENT_DIR, mf);
    const raw = fs.readFileSync(fullPath, 'utf-8');
    const { data } = matter(raw);
    articles.push({
      slug,
      title: data.title || slug,
      category: data.category || path.dirname(mf),
      tags: data.tags || [],
      description: data.description || '',
      related: data.related || [],
      order: data.order || 999,
      icon: data.icon || null,
      interactive: false,
      hasReadme: false,
    });
  }

  articles.sort((a, b) => a.order - b.order);
  return articles;
}

// ------- API Routes -------

// List all articles
app.get('/api/articles', async (req, res) => {
  try {
    const articles = await discoverArticles();
    res.json(articles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load articles' });
  }
});

// Get single article
app.get('/api/article/:slug(*)', async (req, res) => {
  try {
    const slug = req.params.slug;
    const articles = await discoverArticles();
    const article = articles.find(a => a.slug === slug);
    if (!article) return res.status(404).json({ error: 'Article not found' });

    let html = '';
    let headings = [];

    if (article.interactive) {
      // Interactive article: return metadata + flag, frontend will load iframe
      return res.json({
        ...article,
        type: 'interactive',
        iframeSrc: `/interactive/${slug}/`,
      });
    }

    // Markdown article (legacy or README.md fallback)
    let mdPath = path.join(CONTENT_DIR, slug, 'README.md');
    if (!fs.existsSync(mdPath)) {
      mdPath = path.join(CONTENT_DIR, slug + '.md');
    }

    if (fs.existsSync(mdPath)) {
      const raw = fs.readFileSync(mdPath, 'utf-8');
      const { content } = matter(raw);
      html = marked.parse(content);

      const headingRegex = /<h([2-3]) id="([^"]+)">(.+?)<\/h\1>/g;
      let match;
      while ((match = headingRegex.exec(html)) !== null) {
        headings.push({
          level: parseInt(match[1]),
          id: match[2],
          text: match[3].replace(/<[^>]+>/g, ''),
        });
      }
    }

    res.json({
      ...article,
      type: 'markdown',
      html,
      headings,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load article' });
  }
});

// Serve interactive article HTML files
app.get('/interactive/:slug(*)', (req, res) => {
  const slug = req.params.slug.replace(/\/$/, '');
  const htmlPath = path.join(CONTENT_DIR, slug, 'index.html');
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    res.status(404).send('Interactive article not found');
  }
});

// Serve assets from article folders (images, etc.)
app.get('/interactive-assets/:slug(*)/:file', (req, res) => {
  const filePath = path.join(CONTENT_DIR, req.params.slug, req.params.file);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Asset not found');
  }
});

// Graph data
app.get('/api/graph', async (req, res) => {
  try {
    const articles = await discoverArticles();
    const categoryColors = {
      'graphics-fundamentals': '#8b5cf6',
      'game-engines/unity': '#10b981',
      'game-engines/unreal': '#3b82f6',
      'blender': '#f59e0b',
      'photography': '#ec4899',
      'photo-editing': '#f97316',
      'digital-twin': '#06b6d4',
      'algorithms': '#6366f1',
      'frontier': '#ef4444',
      'concepts': '#8b5cf6',
    };

    const nodes = articles.map(a => ({
      id: a.slug,
      label: a.title,
      category: a.category,
      color: categoryColors[a.category] || '#71717a',
      tags: a.tags,
      interactive: a.interactive,
    }));

    const edges = [];
    articles.forEach(a => {
      if (a.related) {
        a.related.forEach(relSlug => {
          edges.push({ source: a.slug, target: relSlug });
        });
      }
    });

    res.json({ nodes, edges });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to build graph' });
  }
});

// Search
app.get('/api/search', async (req, res) => {
  const query = (req.query.q || '').toLowerCase().trim();
  if (!query) return res.json([]);

  try {
    const articles = await discoverArticles();
    const results = [];

    for (const a of articles) {
      let score = 0;
      const title = a.title.toLowerCase();
      const desc = a.description.toLowerCase();
      const tags = a.tags.join(' ').toLowerCase();

      if (title.includes(query)) score += 10;
      if (desc.includes(query)) score += 5;
      if (tags.includes(query)) score += 3;

      // Read README.md or .md for body search
      let body = '';
      const readmePath = path.join(CONTENT_DIR, a.slug, 'README.md');
      const mdPath = path.join(CONTENT_DIR, a.slug + '.md');
      if (fs.existsSync(readmePath)) {
        body = fs.readFileSync(readmePath, 'utf-8').toLowerCase();
      } else if (fs.existsSync(mdPath)) {
        body = fs.readFileSync(mdPath, 'utf-8').toLowerCase();
      }
      if (body.includes(query)) score += 1;

      if (score > 0) {
        let snippet = '';
        const idx = body.indexOf(query);
        if (idx >= 0) {
          const start = Math.max(0, idx - 60);
          const end = Math.min(body.length, idx + query.length + 60);
          snippet = '...' + body.substring(start, end).replace(/\n/g, ' ') + '...';
        }
        results.push({
          slug: a.slug,
          title: a.title,
          category: a.category,
          description: a.description,
          interactive: a.interactive,
          snippet,
          score,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    res.json(results.slice(0, 20));
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// SPA catch-all
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Wiki server running on port ${PORT}`);
});
