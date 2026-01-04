/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#D3FDE1',
          100: '#A6FAC2',
          200: '#7AF8A4',
          300: '#4DF685',
          400: '#21F367',
          500: '#0BDA51', // Malachite - primary vibrant green
          600: '#0AB643',
          700: '#089136',
          800: '#066D28',
          900: '#04491B',
          950: '#02240D',
        },
        accent: {
          50: '#EDF5E7',
          100: '#DBECD0',
          200: '#C9E2B8',
          300: '#B7D9A1',
          400: '#A5CF89',
          500: '#93C572', // Willow Green - warm accent
          600: '#77B64D',
          700: '#5F933C',
          800: '#476E2D',
          900: '#2F4A1E',
        },
        success: {
          500: '#2E8B57', // Sea Green
          600: '#267347',
        },
        neutral: {
          50: '#F8F9FA',
          100: '#F1F3F5',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#ADB5BD',
          600: '#868E96',
          700: '#495057',
          800: '#343A40',
          850: '#2B3035',
          900: '#212529',
          950: '#18191B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        'level-1': '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        'level-2': '0 4px 6px -1px rgb(0 0 0 / 0.15)',
        'level-3': '0 10px 15px -3px rgb(0 0 0 / 0.2)',
        'glow': '0 0 20px rgba(11, 218, 81, 0.3)',
      },
    },
  },
  plugins: [],
};