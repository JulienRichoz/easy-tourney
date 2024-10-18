/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        custom_dark_1: '#1f2937',  // Exemple de couleur personnalisée
        custom_dark_2: '#111827',
        custom_light_1: '#ffffff',
        custom_light_2: '#f3f4f6',
      },
    },
  },
  plugins: [],
};
