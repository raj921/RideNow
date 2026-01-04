/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E7F0F7',
          100: '#C1D9E8',
          200: '#9AC1D9',
          300: '#74A9CA',
          400: '#5897BD',
          500: '#4682B4', // Steel Blue - primary
          600: '#3A6D96',
          700: '#2F5778',
          800: '#23415A',
          900: '#172B3C',
          950: '#0C161E',
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
        neutral: {
          50: '#F8F9FA',
          100: '#E9ECEF',
          200: '#DEE2E6',
          300: '#CED4DA',
          400: '#ADB5BD',
          500: '#708090', // Slate Grey
          600: '#5C6A78',
          700: '#4A5560',
          800: '#36454F', // Charcoal Blue
          850: '#2F4F4F', // Dark Slate Grey
          900: '#1E2933',
          950: '#0F1419',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.05em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      borderRadius: {
        'sm': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'level-0': 'none',
        'level-1': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'level-2': '0 4px 6px -1px rgb(0 0 0 / 0.15), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'level-3': '0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.15)',
        'glow': '0 0 20px rgba(70, 143, 234, 0.3)',
        'glow-brand': '0 0 20px rgba(70, 130, 180, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
};