/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brightColor: "#2563EB",
        backgroundColor: "#3B82F6",
        textColor: "#333333",
      },
    },

  },
  plugins: [],
}