/**
 * Shared interactive utilities for all wiki articles
 * Provides: theme sync, canvas helpers, math utils, UI helpers
 */

const Wiki = {
  // --- Theme ---
  theme: 'dark',

  initTheme() {
    // Read theme from URL param or parent
    const params = new URLSearchParams(window.location.search);
    this.theme = params.get('theme') || 'dark';
    document.documentElement.className = this.theme;

    // Listen for theme changes from parent frame
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'theme-change') {
        this.theme = e.data.theme;
        document.documentElement.className = this.theme;
        if (this._onThemeChange) this._onThemeChange(this.theme);
      }
    });
  },

  onThemeChange(fn) { this._onThemeChange = fn; },

  colors() {
    const dark = this.theme === 'dark';
    return {
      bg: dark ? '#0f0f14' : '#ffffff',
      bgSecondary: dark ? '#1a1b27' : '#f4f4f5',
      canvasBg: dark ? '#0a0a10' : '#fafafa',
      text: dark ? '#e4e4e7' : '#18181b',
      textMuted: dark ? '#a1a1aa' : '#52525b',
      textDim: dark ? '#71717a' : '#a1a1aa',
      accent: dark ? '#6366f1' : '#b45309',
      accentLight: dark ? '#818cf8' : '#d97706',
      grid: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
      gridStrong: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      red: '#ef4444',
      green: '#10b981',
      blue: '#3b82f6',
      yellow: '#f59e0b',
      purple: '#8b5cf6',
      pink: '#ec4899',
      cyan: '#06b6d4',
      orange: '#f97316',
      // Aliases for backward compat
      fg: dark ? '#e4e4e7' : '#18181b',
    };
  },

  // --- Canvas Helpers ---
  createCanvas(container, width, height, dpr) {
    // Accept string ID or DOM element
    if (typeof container === 'string') {
      const el = document.getElementById(container);
      // If the element IS a canvas, just return it as-is (articles manage their own sizing)
      if (el && el.tagName === 'CANVAS') {
        return el;
      }
      container = el;
    }
    dpr = dpr || Math.min(window.devicePixelRatio || 1, 2);
    const canvas = document.createElement('canvas');
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    if (container) container.appendChild(canvas);
    return { canvas, ctx, width, height, dpr };
  },

  resizeCanvas(canvasObj, width, height) {
    const dpr = canvasObj.dpr;
    canvasObj.canvas.width = width * dpr;
    canvasObj.canvas.height = height * dpr;
    canvasObj.canvas.style.width = width + 'px';
    canvasObj.canvas.style.height = height + 'px';
    canvasObj.ctx.scale(dpr, dpr);
    canvasObj.width = width;
    canvasObj.height = height;
  },

  drawGrid(ctx, w, h, spacing, colors) {
    spacing = spacing || 40;
    colors = colors || this.colors();
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    for (let x = spacing; x < w; x += spacing) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = spacing; y < h; y += spacing) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  },

  drawAxes(ctx, cx, cy, w, h, colors) {
    colors = colors || this.colors();
    ctx.strokeStyle = colors.gridStrong;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
  },

  drawArrow(ctx, x1, y1, x2, y2, color, headSize) {
    headSize = headSize || 8;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headSize * Math.cos(angle - 0.4), y2 - headSize * Math.sin(angle - 0.4));
    ctx.lineTo(x2 - headSize * Math.cos(angle + 0.4), y2 - headSize * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();
  },

  drawDot(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  },

  drawLabel(ctx, text, x, y, color, size, align) {
    ctx.fillStyle = color || this.colors().textMuted;
    ctx.font = (size || 11) + "px 'Space Mono', monospace";
    ctx.textAlign = align || 'center';
    ctx.fillText(text, x, y);
  },

  // --- Math Helpers ---
  lerp(a, b, t) { return a + (b - a) * t; },
  clamp(v, min, max) { return Math.max(min, Math.min(max, v)); },
  map(v, a1, b1, a2, b2) { return a2 + (v - a1) * (b2 - a2) / (b1 - a1); },
  dist(x1, y1, x2, y2) { return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2); },

  // Vector ops
  vec2(x, y) { return { x, y }; },
  vec2Add(a, b) { return { x: a.x + b.x, y: a.y + b.y }; },
  vec2Sub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; },
  vec2Scale(a, s) { return { x: a.x * s, y: a.y * s }; },
  vec2Dot(a, b) { return a.x * b.x + a.y * b.y; },
  vec2Len(a) { return Math.sqrt(a.x * a.x + a.y * a.y); },
  vec2Norm(a) { const l = Wiki.vec2Len(a) || 1; return { x: a.x / l, y: a.y / l }; },
  vec2Reflect(v, n) { const d = 2 * Wiki.vec2Dot(v, n); return { x: v.x - d * n.x, y: v.y - d * n.y }; },

  // 3x3 matrix (for 2D transforms displayed as matrices)
  mat3Identity() { return [1,0,0, 0,1,0, 0,0,1]; },
  mat3Multiply(a, b) {
    return [
      a[0]*b[0]+a[1]*b[3]+a[2]*b[6], a[0]*b[1]+a[1]*b[4]+a[2]*b[7], a[0]*b[2]+a[1]*b[5]+a[2]*b[8],
      a[3]*b[0]+a[4]*b[3]+a[5]*b[6], a[3]*b[1]+a[4]*b[4]+a[5]*b[7], a[3]*b[2]+a[4]*b[5]+a[5]*b[8],
      a[6]*b[0]+a[7]*b[3]+a[8]*b[6], a[6]*b[1]+a[7]*b[4]+a[8]*b[7], a[6]*b[2]+a[7]*b[5]+a[8]*b[8],
    ];
  },
  mat3TransformPoint(m, p) {
    return { x: m[0]*p.x + m[1]*p.y + m[2], y: m[3]*p.x + m[4]*p.y + m[5] };
  },

  // Color helpers
  hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      const hue2rgb = (p, q, t) => { if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p; };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    const result = { r: Math.round(r*255), g: Math.round(g*255), b: Math.round(b*255) };
    // Also support array-style access for backward compat
    result[0] = result.r; result[1] = result.g; result[2] = result.b;
    return result;
  },

  rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  },

  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
  },

  // --- Mouse tracking ---
  trackMouse(canvas) {
    const state = { x: 0, y: 0, down: false, inside: false };
    const rect = () => canvas.getBoundingClientRect();
    canvas.addEventListener('mousemove', e => { const r = rect(); state.x = e.clientX - r.left; state.y = e.clientY - r.top; state.inside = true; });
    canvas.addEventListener('mousedown', () => { state.down = true; });
    canvas.addEventListener('mouseup', () => { state.down = false; });
    canvas.addEventListener('mouseleave', () => { state.inside = false; state.down = false; });
    canvas.addEventListener('touchmove', e => { e.preventDefault(); const t = e.touches[0]; const r = rect(); state.x = t.clientX - r.left; state.y = t.clientY - r.top; state.inside = true; }, { passive: false });
    canvas.addEventListener('touchstart', e => { state.down = true; const t = e.touches[0]; const r = rect(); state.x = t.clientX - r.left; state.y = t.clientY - r.top; state.inside = true; });
    canvas.addEventListener('touchend', () => { state.down = false; });
    return state;
  },

  // --- Animation loop ---
  animate(fn) {
    let running = true;
    const loop = () => {
      if (!running) return;
      fn();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return { stop: () => { running = false; } };
  },
};

// Auto-init theme (set html class immediately for CSS variables)
Wiki.initTheme();

// Body-dependent init must wait for DOM (script often loads in <head>)
function _wikiBodyInit() {
  if (window.self !== window.top) {
    document.body.classList.add('in-iframe');
  }
}
if (document.body) {
  _wikiBodyInit();
} else {
  document.addEventListener('DOMContentLoaded', _wikiBodyInit);
}
