/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#19A6A6',
          'teal-dark': '#137f7f',
          'teal-light': '#e6f7f7',
          orange: '#E8491B',
          'orange-dark': '#c03a14',
          'orange-light': '#fdf0ec',
          black: '#000000',
        },
      },
      fontFamily: {
        sans: ['Work Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
