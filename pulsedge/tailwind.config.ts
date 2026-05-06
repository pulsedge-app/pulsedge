import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0b0f19',
          800: '#0f1623',
          700: '#141c2e',
          600: '#1a2540',
          500: '#1e2d4d',
        },
        teal: {
          DEFAULT: '#00d4aa',
          hover: '#00bfa0',
          muted: 'rgba(0, 212, 170, 0.15)',
          glow: 'rgba(0, 212, 170, 0.3)',
        },
        surface: {
          DEFAULT: '#111827',
          hover: '#1f2937',
          border: '#1e293b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        teal: '0 0 20px rgba(0, 212, 170, 0.15)',
        'teal-lg': '0 0 40px rgba(0, 212, 170, 0.2)',
        card: '0 4px 24px rgba(0, 0, 0, 0.4)',
        hero: '0 8px 40px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-teal': 'pulse-teal 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        ticker: 'ticker 50s linear infinite',
      },
      keyframes: {
        'pulse-teal': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
