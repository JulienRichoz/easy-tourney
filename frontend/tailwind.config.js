/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Utilise la classe 'dark' pour activer le mode sombre
  theme: {
    extend: {
      fontFamily: {
        sans: ['Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        // Palette de couleurs pour le mode clair
        light: {
          background: '#f3f4f6', // bg-gray-100
          card: '#ffffff',
          menu: '#1f2937', // bg-gray-800
          menuText: '#ffffff',
          menuActive: '#22C55E', // green-500
          menuHoverText: '#38a169', // green-400
          profileText: '#38a169', // green-400
          profileHoverText: '#2f855a', // green-700
          logoutButton: {
            default: '#ef4444', // red-500
            hover: '#dc2626', // red-700
          },
          subMenu: {
            background: '#ffffff',
            border: '#e2e8f0',
            text: '#4a5568',
            hoverBackground: '#e2e8f0',
            hoverText: '#2f855a',
            activeText: '#2f855a',
            activeBar: '#38a169',
          },
          buttonVariants: {
            primary: {
              default: '#16a34a', // green-600
              hover: '#15803d',   // green-700
            },
            secondary: {
              default: '#6b7280', // gray-500
              hover: '#4b5563',   // gray-600
            },
            danger: {
              default: '#ef4444', // red-500
              hover: '#dc2626',   // red-600
            },
            warning: {
              default: '#eab308', // yellow-500
              hover: '#ca8a04',   // yellow-600
            },
            disabled: {
              default: '#9ca3af', // gray-400
            },
          },
          form: {
            background: '#ffffff',
            text: '#4a5568', // text-gray-700
            error: '#ef4444', // text-red-500
            iconQuestion: '#9ca3af', // text-gray-400
            tooltip: {
              background: '#374151', // bg-gray-700
              text: '#ffffff',
            },
            border: {
              default: '#d1d5db', // border-gray-300
              error: '#ef4444',    // border-red-500
            },
          },
          modal: {
            background: 'rgba(0, 0, 0, 0.5)', // bg-opacity-50
            content: '#ffffff',
          },
          title: '#1f2937', // text-gray-800
        },

        // Palette de couleurs pour le mode sombre
        dark: {
          background: '#111827', // bg-custom_dark_1
          card: '#1f2937', // bg-custom_dark_1
          menu: '#1f2937', // bg-gray-800
          menuText: '#ffffff',
          menuActive: '#22C55E', // green-500
          menuHoverText: '#38a169', // green-400
          profileText: '#38a169', // green-400
          profileHoverText: '#2f855a', // green-700
          logoutButton: {
            default: '#ef4444', // red-500
            hover: '#dc2626',   // red-700
          },
          subMenu: {
            background: '#2d3748',
            border: '#374151', // gris sombre
            text: '#cbd5e1', // text-gray-300
            hoverBackground: '#374151',
            hoverText: '#38a169',
            activeText: '#38a169',
            activeBar: '#16a34a',
          },
          buttonVariants: {
            primary: {
              default: '#16a34a', // green-600
              hover: '#15803d',   // green-700
            },
            secondary: {
              default: '#6b7280', // gray-500
              hover: '#4b5563',   // gray-600
            },
            danger: {
              default: '#ef4444', // red-500
              hover: '#dc2626',   // red-600
            },
            warning: {
              default: '#f59e0b', // yellow-500
              hover: '#d97706',   // yellow-600
            },
            disabled: {
              default: '#6b7280', // gray-500
            },
          },
          form: {
            background: '#1f2937',
            text: '#cbd5e1', // text-gray-300
            error: '#ef4444', // text-red-500
            iconQuestion: '#9ca3af', // text-gray-400
            tooltip: {
              background: '#4b5563', // bg-gray-600
              text: '#ffffff',
            },
            border: {
              default: '#374151', // border-gray-600
              error: '#ef4444',    // border-red-500
            },
          },
          modal: {
            background: 'rgba(0, 0, 0, 0.7)', // bg-opacity-70
            content: '#1f2937',
          },
          title: '#f3f4f6', // text-gray-100
        },

        // Palette de couleurs personnalisées pour d'autres thèmes (optionnel)
        // Vous pouvez ajouter ici d'autres palettes pour des thèmes personnalisés
      },
    },
  },
  plugins: [],
};
