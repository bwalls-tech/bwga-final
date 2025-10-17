
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nexus-primary': {
          900: '#ffffff', // Main BG
          800: '#f9fafb', // Light Surface
        },
        'nexus-surface': {
          800: '#ffffff', // Main Surface (cards)
          700: '#f9fafb', // Light Gray Surface
        },
        'nexus-text': {
          primary: '#1a1a1a',   // Near-black
          secondary: '#4d4d4d', // Dark Gray
          muted: '#666666',     // Medium Gray
        },
        'nexus-border': {
          medium: '#e0e0e0', // Light Gray
          subtle: '#f3f4f6', // Lighter Gray
        },
        'nexus-accent': {
          gold: '#F97316',       // Brighter Orange
          'gold-dark': '#EA580C', // Darker Orange for hover
          cyan: '#00529B',       // Brighter Royal Blue
          'cyan-dark': '#00417A', // Darker Royal Blue for hover
        },
        'nexus-warning': '#f59e0b', // Amber
      }
    },
  },
  plugins: [],
}