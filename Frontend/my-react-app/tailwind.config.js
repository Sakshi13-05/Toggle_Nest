/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#bef264',
        darkBg: '#0d0d0d',
        cardBg: '#1a1a1a',
      },
    },
  },
  plugins: [],
}