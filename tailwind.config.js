/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  // Scan every JS/TS file under src so no class ever gets missed
  content: [
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        surface: 'var(--background)',
        base:    'var(--foreground)',
        card:    'var(--card)',
        border:  'var(--border)',
      },
    },
  },
  plugins: [
    // only Tailwind plugins belong here
    function ({ addUtilities }) {
      addUtilities({
        '.bg-surface':     { backgroundColor: 'var(--background)' },
        '.text-base':      { color:           'var(--foreground)' },
        '.bg-card':        { backgroundColor: 'var(--card)' },
        '.border-default': { borderColor:     'var(--border)' },
        '.line-clamp-1':   { 
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '1',
        },
        '.line-clamp-2':   { 
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '2',
        },
        '.line-clamp-3':   { 
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '3',
        },
      });
    },
  ],
};
