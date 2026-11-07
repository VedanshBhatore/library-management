/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f1f0ff',
          100: '#e4e1ff',
          200: '#cbc5ff',
          300: '#a89cff',
          400: '#8470ff',
          500: '#6a4bff',
          600: '#5b2eff',
          700: '#4c1fe0',
          800: '#3f1bb5',
          900: '#351a8f',
          950: '#200f5c',
        },
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 1px rgb(15 23 42 / 0.06)',
        card: '0 1px 2px 0 rgb(15 23 42 / 0.03), 0 8px 24px -8px rgb(15 23 42 / 0.08)',
        glow: '0 0 0 1px rgb(91 46 255 / 0.08), 0 8px 30px -8px rgb(91 46 255 / 0.35)',
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
