// Wiki SPA — main application logic
let allArticles = [];

const categoryMeta = {
  'graphics-fundamentals': { label: 'Graphics Fundamentals', color: '#8b5cf6', icon: '◆' },
  'game-engines/unity':    { label: 'Unity',                 color: '#10b981', icon: '▲' },
  'game-engines/unreal':   { label: 'Unreal Engine',         color: '#3b82f6', icon: '■' },
  'blender':               { label: 'Blender',               color: '#f59e0b', icon: '●' },
  'photography':           { label: 'Photography',           color: '#ec4899', icon: '◎' },
  'photo-editing':         { label: 'Photo Editing',         color: '#f97316', icon: '◐' },
  'digital-twin':          { label: 'Digital Twin',          color: '#06b6d4', icon: '◇' },
  'algorithms':            { label: 'Algorithms & DS',       color: '#6366f1', icon: '⬡' },
  'frontier':              { label: 'Frontier Research',     color: '#ef4444', icon: '★' },
  'concepts':              { label: 'Core Concepts',         color: '#8b5cf6', icon: '⊙' },
};

// ---- Router ----
const router = {
  navigate(path, pushState = true) {
    if (pushState) history.pushState(null, '', path);
    this.resolve(path);
  },

  resolve(path) {
    // Reset active states
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

    if (path === '/' || path === '') {
      showView('home');
      document.querySelector('[data-view="articles"]')?.classList.add('active');
    } else if (path === '/graph') {
      showView('graph');
      document.querySelector('[data-view="graph"]')?.classList.add('active');
      KnowledgeGraph.init();
    } else if (path.startsWith('/article/')) {
      const slug = path.replace('/article/', '');
      showView('article');
      loadArticle(slug);
      document.querySelector('[data-view="articles"]')?.classList.add('active');
    } else {
      showView('home');
    }
  }
};

window.addEventListener('popstate', () => router.resolve(location.pathname));

// ---- Views ----
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  const target = document.getElementById('view-' + name);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('fade-in');
    setTimeout(() => target.classList.remove('fade-in'), 300);
  }
  // Close mobile sidebar
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.add('hidden');
  // Scroll top
  window.scrollTo(0, 0);
}

// ---- Load Articles ----
async function loadAllArticles() {
  try {
    const res = await fetch('/api/articles');
    allArticles = await res.json();
    renderSidebar();
    renderHome();
  } catch (err) {
    console.error('Failed to load articles:', err);
  }
}

// ---- Sidebar ----
function renderSidebar() {
  const tree = document.getElementById('sidebar-tree');
  if (!tree) return;

  // Group by category
  const groups = {};
  allArticles.forEach(a => {
    const cat = a.category;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(a);
  });

  // Sort categories
  const catOrder = [
    'concepts', 'graphics-fundamentals', 'algorithms',
    'game-engines/unity', 'game-engines/unreal', 'blender',
    'photography', 'photo-editing', 'digital-twin', 'frontier'
  ];

  let html = '';
  catOrder.forEach(cat => {
    const items = groups[cat];
    if (!items) return;
    const meta = categoryMeta[cat] || { label: cat, color: '#71717a', icon: '•' };

    html += `<div class="sidebar-category">
      <div class="sidebar-cat-header" onclick="toggleCategory(this)">
        <span class="sidebar-cat-dot" style="background:${meta.color}"></span>
        <span>${meta.label}</span>
        <span class="sidebar-cat-arrow">▸</span>
      </div>
      <div class="sidebar-cat-items">
        ${items.map(a => `<a class="sidebar-item" data-slug="${a.slug}" onclick="router.navigate('/article/${a.slug}')">${a.title}</a>`).join('')}
      </div>
    </div>`;
  });

  tree.innerHTML = html;
}

function toggleCategory(header) {
  header.classList.toggle('open');
  const items = header.nextElementSibling;
  items.classList.toggle('open');
}

// ---- Home View ----
function renderHome() {
  // Stats
  const stats = document.getElementById('hero-stats');
  const categories = new Set(allArticles.map(a => a.category));
  const tags = new Set(allArticles.flatMap(a => a.tags));
  if (stats) {
    const interactiveCount = allArticles.filter(a => a.interactive).length;
    stats.innerHTML = `
      <div class="stat-item"><span class="stat-number">${allArticles.length}</span><span class="stat-label">Articles</span></div>
      <div class="stat-item"><span class="stat-number">${interactiveCount}</span><span class="stat-label">Interactive</span></div>
      <div class="stat-item"><span class="stat-number">${categories.size}</span><span class="stat-label">Categories</span></div>
    `;
  }

  // Category grid
  const grid = document.getElementById('category-grid');
  if (!grid) return;

  const groups = {};
  allArticles.forEach(a => {
    if (!groups[a.category]) groups[a.category] = [];
    groups[a.category].push(a);
  });

  const catOrder = [
    'concepts', 'graphics-fundamentals', 'algorithms',
    'game-engines/unity', 'game-engines/unreal', 'blender',
    'photography', 'photo-editing', 'digital-twin', 'frontier'
  ];

  grid.innerHTML = catOrder.map(cat => {
    const items = groups[cat];
    if (!items) return '';
    const meta = categoryMeta[cat] || { label: cat, color: '#71717a' };
    const preview = items.slice(0, 5);
    const more = items.length > 5 ? `<div class="category-card-item" style="color:var(--text-dim)">+ ${items.length - 5} more</div>` : '';

    return `<div class="category-card" onclick="toggleCategory(this.querySelector('.sidebar-cat-header'))">
      <div class="category-card-header">
        <span class="category-card-dot" style="background:${meta.color}"></span>
        <span class="category-card-title">${meta.label}</span>
        <span class="category-card-count">${items.length}</span>
      </div>
      <div class="category-card-items">
        ${preview.map(a => `<div class="category-card-item" onclick="event.stopPropagation(); router.navigate('/article/${a.slug}')">${a.title}</div>`).join('')}
        ${more}
      </div>
    </div>`;
  }).join('');
}

// ---- Article View ----
async function loadArticle(slug) {
  try {
    const res = await fetch('/api/article/' + slug);
    if (!res.ok) throw new Error('Not found');
    const article = await res.json();

    // Meta
    const meta = document.getElementById('article-meta');
    const catInfo = categoryMeta[article.category] || { label: article.category, color: '#71717a' };
    const interactiveBadge = article.interactive ? '<span class="tag" style="background:var(--success,#10b981);color:white">Interactive</span>' : '';
    meta.innerHTML = `
      <h1>${article.title}</h1>
      ${article.description ? `<p style="color:var(--text-muted);font-family:'Space Grotesk',sans-serif;font-weight:300;font-size:0.95rem;letter-spacing:0">${article.description}</p>` : ''}
      <div class="article-tags">
        <span class="tag cat-tag" style="background:${catInfo.color}">${catInfo.label}</span>
        ${interactiveBadge}
        ${article.tags.map(t => `<span class="tag">${t}</span>`).join('')}
      </div>
    `;

    const bodyEl = document.getElementById('article-body');
    const tocNav = document.getElementById('toc-nav');
    const tocSidebar = document.getElementById('toc-sidebar');

    if (article.type === 'interactive' && article.iframeSrc) {
      // Interactive article: show in iframe
      const currentTheme = document.documentElement.className || 'dark';
      bodyEl.innerHTML = `
        <iframe
          id="article-iframe"
          src="${article.iframeSrc}?theme=${currentTheme}"
          style="width:100%;border:none;border-radius:8px;min-height:600px;background:var(--bg-secondary);"
          onload="this.style.height = Math.max(600, this.contentWindow.document.body.scrollHeight + 40) + 'px'"
        ></iframe>
      `;
      // Hide TOC for interactive articles (they handle their own navigation)
      if (tocSidebar) tocSidebar.style.display = 'none';
      tocNav.innerHTML = '';

      // Auto-resize iframe on content change
      const iframe = document.getElementById('article-iframe');
      if (iframe) {
        const resizeObserver = setInterval(() => {
          try {
            const newH = iframe.contentWindow.document.body.scrollHeight + 40;
            if (newH > 100) iframe.style.height = Math.max(600, newH) + 'px';
          } catch(e) {}
        }, 500);
        // Store for cleanup
        iframe._resizeInterval = resizeObserver;
      }
    } else {
      // Markdown article
      bodyEl.innerHTML = article.html || '<p style="color:var(--text-muted)">No content available.</p>';
      if (tocSidebar) tocSidebar.style.display = '';

      // TOC
      tocNav.innerHTML = (article.headings || []).map(h =>
        `<a href="#${h.id}" class="toc-h${h.level}" onclick="event.preventDefault(); document.getElementById('${h.id}').scrollIntoView({behavior:'smooth'})">${h.text}</a>`
      ).join('');
    }

    // Related
    const relatedEl = document.getElementById('article-related');
    if (article.related && article.related.length > 0) {
      const relatedArticles = article.related.map(s => allArticles.find(a => a.slug === s)).filter(Boolean);
      relatedEl.innerHTML = `
        <div class="related-title">Related Articles</div>
        <div class="related-list">
          ${relatedArticles.map(a => {
            const badge = a.interactive ? ' <span style="font-size:0.55rem;color:var(--success,#10b981)">●</span>' : '';
            return `<a class="related-link" onclick="router.navigate('/article/${a.slug}')">${a.title}${badge}</a>`;
          }).join('')}
        </div>
      `;
    } else {
      relatedEl.innerHTML = '';
    }

    // Highlight active sidebar item
    document.querySelectorAll('.sidebar-item').forEach(el => {
      el.classList.toggle('active', el.dataset.slug === slug);
      if (el.dataset.slug === slug) {
        const cat = el.closest('.sidebar-category');
        if (cat) {
          cat.querySelector('.sidebar-cat-header').classList.add('open');
          cat.querySelector('.sidebar-cat-items').classList.add('open');
        }
      }
    });

  } catch (err) {
    document.getElementById('article-body').innerHTML = '<p style="color:var(--text-muted)">Article not found.</p>';
  }
}

// Send theme changes to iframes
function broadcastThemeToIframes(theme) {
  const iframe = document.getElementById('article-iframe');
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({ type: 'theme-change', theme }, '*');
  }
}

// ---- Search ----
let searchTimeout = null;

function initSearch() {
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  if (!input || !results) return;

  input.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const q = input.value.trim();
    if (q.length < 2) {
      results.classList.add('hidden');
      return;
    }
    searchTimeout = setTimeout(async () => {
      try {
        const res = await fetch('/api/search?q=' + encodeURIComponent(q));
        const data = await res.json();
        if (data.length === 0) {
          results.innerHTML = '<div class="search-result-item"><div class="search-result-title" style="color:var(--text-dim)">No results found</div></div>';
        } else {
          results.innerHTML = data.map(r => `
            <div class="search-result-item" onclick="router.navigate('/article/${r.slug}'); document.getElementById('search-results').classList.add('hidden'); document.getElementById('search-input').value = '';">
              <div class="search-result-title">${r.title}</div>
              <div class="search-result-cat">${(categoryMeta[r.category] || {}).label || r.category}</div>
              ${r.snippet ? `<div class="search-result-snippet">${r.snippet}</div>` : ''}
            </div>
          `).join('');
        }
        results.classList.remove('hidden');
      } catch (err) {
        results.classList.add('hidden');
      }
    }, 200);
  });

  // Close search on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      results.classList.add('hidden');
    }
  });

  // Ctrl+K shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      input.focus();
    }
    if (e.key === 'Escape') {
      results.classList.add('hidden');
      input.blur();
    }
  });
}

// ---- Mobile Sidebar ----
function initMobileSidebar() {
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (toggle && sidebar && overlay) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('hidden');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.add('hidden');
    });
  }
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  await loadAllArticles();
  initSearch();
  initMobileSidebar();
  router.resolve(location.pathname);
});
