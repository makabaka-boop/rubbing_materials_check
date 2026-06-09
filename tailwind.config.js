/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        ink: '#1a1a2e',
        paper: '#f5f0e8',
        'paper-dark': '#e8e0d0',
        vermilion: '#c0392b',
        pine: '#2d6a4f',
        amber: '#d4a017',
        'ink-light': '#2d2d4a',
        'ink-muted': '#4a4a6a',
        'paper-muted': '#d4cfc4',
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'serif'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
