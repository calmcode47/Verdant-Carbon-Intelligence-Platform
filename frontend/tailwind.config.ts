/**
 * @file tailwind.config.ts
 * @description Tailwind CSS configuration file for the Verdant Carbon Intelligence Platform.
 * Extends the default palette with custom Verdant brand colors (green, teal, dark backgrounds)
 * and defines keyframes and animations for interactive UI elements.
 */

import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        verdant: {
          green: '#00E676',
          teal: '#1DE9B6',
          dark: '#0A0F0D',
          mid: '#141C18',
          muted: '#1E2E26',
        }
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        heading: ['Syne', 'sans-serif'],
        body: ['Space Grotesk', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-green': 'pulseGreen 2s ease-in-out infinite',
        'scan': 'scan 3s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'orbit': 'orbit 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGreen: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 230, 118, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 230, 118, 0.6)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        glow: {
          'from': { textShadow: '0 0 10px #00E676' },
          'to': { textShadow: '0 0 20px #00E676, 0 0 40px #00E676' },
        },
        orbit: {
          'from': { transform: 'rotate(0deg) translateX(120px) rotate(0deg)' },
          'to': { transform: 'rotate(360deg) translateX(120px) rotate(-360deg)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
