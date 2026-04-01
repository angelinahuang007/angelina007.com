import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark mode colors
        dark: {
          bg: '#0f0f14',
          'bg-secondary': '#1a1b27',
          text: '#e4e4e7',
          'text-muted': '#a1a1aa',
          accent: '#6366f1',
          'accent-light': '#818cf8',
          sky: '#38bdf8',
        },
        // Light mode colors
        light: {
          bg: '#ffffff',
          'bg-secondary': '#f4f4f5',
          text: '#18181b',
          'text-muted': '#52525b',
          accent: '#b45309',
          'accent-light': '#d97706',
          sky: '#d97706',
        },
      },
      fontFamily: {
        mono: ['var(--font-space-mono)', 'monospace'],
        sans: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
        code: ['var(--font-jetbrains-mono)', 'Menlo', 'Monaco', 'monospace'],
      },
      letterSpacing: {
        'wider-custom': '0.06em',
      },
      spacing: {
        '128': '32rem',
      },
      transitionDuration: {
        '2000': '2000ms',
      },
    },
  },
  plugins: [],
};

export default config;
