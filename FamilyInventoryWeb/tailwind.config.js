/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#FFF0F5',
          100: '#FFD6E8',
          400: '#FF8EBA',
          500: '#FF6B9D',
          600: '#E8507F',
        },
        accent: '#FF8E53',
        surface: '#FFFFFF',
        bg: '#FFF8F0',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
