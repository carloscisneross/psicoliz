/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'blush-pink': '#FCE6EA',
        'golden-brown': '#A6753D',
        'soft-pink': '#F8D7DA',
        'warm-brown': '#8B5A2B',
      },
      fontFamily: {
        'elegant': ['Georgia', 'serif'],
        'modern': ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}