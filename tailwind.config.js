/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        jphone: {
          light: '#33A9FF',
          DEFAULT: '#0093E9',
          dark: '#007BB5',
        }
      }
    },
  },
  plugins: [],
}
