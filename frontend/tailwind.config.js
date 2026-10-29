/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Warm amber brand so the POS is easy to tell apart from the teal booking app
        brand: {
          50: '#fdf6ec',
          100: '#f9e7cc',
          200: '#f1cd98',
          500: '#c27c2c',
          600: '#a5651f',
          700: '#85501a',
          900: '#4a2e10',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
