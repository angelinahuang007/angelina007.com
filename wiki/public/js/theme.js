// Theme system — matches angelina007.com dark/light toggle
(function() {
  const stored = localStorage.getItem('wiki-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = stored || (prefersDark ? 'dark' : 'light');
  document.documentElement.className = theme;
  updateHljsTheme(theme);

  function updateHljsTheme(t) {
    const link = document.getElementById('hljs-theme');
    if (link) {
      link.href = t === 'dark'
        ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
        : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('icon-sun');
    const moonIcon = document.getElementById('icon-moon');

    function applyTheme(t) {
      document.documentElement.className = t;
      localStorage.setItem('wiki-theme', t);
      updateHljsTheme(t);
      if (sunIcon && moonIcon) {
        sunIcon.classList.toggle('hidden', t === 'dark');
        moonIcon.classList.toggle('hidden', t === 'light');
      }
      // Broadcast to interactive article iframes
      if (typeof broadcastThemeToIframes === 'function') {
        broadcastThemeToIframes(t);
      }
    }

    applyTheme(theme);

    if (toggle) {
      toggle.addEventListener('click', () => {
        const current = document.documentElement.className;
        applyTheme(current === 'dark' ? 'light' : 'dark');
      });
    }
  });
})();
