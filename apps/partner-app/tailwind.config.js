/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E0E5FF',
          100: '#C2CCFF',
          200: '#A3B3FF',
          300: '#8599FF',
          400: '#6680FF',
          500: '#4666FF', // Electric Sapphire - primary
          600: '#1139FF',
          700: '#0024DA',
          800: '#001BA3',
          900: '#00126D',
          950: '#000936',
        },
        accent: {
          50: '#E0EDFC',
          100: '#C2DAF8',
          200: '#A3C8F5',
          300: '#85B6F1',
          400: '#66A3EE',
          500: '#468FEA', // Blue Energy - accent
          600: '#1975E6',
          700: '#145EB8',
          800: '#0F468A',
          900: '#0A2F5C',
        },
        trust: {
          500: '#1560BD', // Tech Blue - trustworthy
          600: '#11509D',
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
        'glow': '0 0 20px rgba(70, 102, 255, 0.3)',
      },
    },
  },
  plugins: [],
};