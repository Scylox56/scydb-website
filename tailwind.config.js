/** @type {import('tailwindcss').Config} */


module.exports = {
  content: [
    "./pages/**/*.{html,js}",
    "./assets/js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4338ca',
          dark: '#3730a3'
        },
        secondary: {
          DEFAULT: '#e11d48',
          dark: '#be123c'
        },
        dark: {
          DEFAULT: '#0f172a',
          light: '#1e293b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'spin-slow': 'spin 3s linear infinite'
      }
    }
  },
  plugins: [
    require('daisyui'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ],
  daisyui: {
    themes: [
      {
        scydb: {
          "primary": "#4338ca",
          "secondary": "#e11d48",
          "accent": "#f59e0b",
          "neutral": "#1e293b",
          "base-100": "#0f172a",
          "info": "#0ea5e9",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
    ],
  }
}