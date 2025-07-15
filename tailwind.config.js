/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: ['bg-surface', 'text-base', 'bg-card', 'border-default'],
  theme: {
    extend: {
      colors: {
        surface: 'var(--background)',
        base: 'var(--foreground)',
        card: 'var(--card)',
        border: 'var(--border)',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.bg-surface': {
          backgroundColor: 'var(--background)',
        },
        '.text-base': {
          color: 'var(--foreground)',
        },
        '.bg-card': {
          backgroundColor: 'var(--card)',
        },
        '.border-default': {
          borderColor: 'var(--border)',
        },
      });
    },
  ],
}; 