import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        blush: {
          50: '#fff7f7',
          100: '#ffe8e8',
          200: '#f8caca',
          500: '#c86b78',
          600: '#aa5262',
        },
        sage: {
          100: '#e9f0e7',
          300: '#b9c9b2',
          500: '#7f936f',
          600: '#617256',
          700: '#4c5f42',
        },
        gold: {
          100: '#f4ead6',
          500: '#bd8d39',
          600: '#9c7028',
        },
        ink: '#2f2a2a',
      },
      boxShadow: {
        soft: '0 18px 50px rgba(82, 61, 60, 0.12)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
