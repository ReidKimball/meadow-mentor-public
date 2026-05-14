/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          heading: ['var(--font-heading)', 'sans-serif'],
          body: ['var(--font-body)', 'sans-serif'],
        },
      },
    },
    plugins: [],
  }