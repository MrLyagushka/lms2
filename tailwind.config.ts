import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/hooks/**/*.{ts,tsx}',
    './src/store/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Брендовая палитра платформы
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd3ff',
          300: '#8eb6ff',
          400: '#5a8dff',
          500: '#3364f4',
          600: '#1f47db',
          700: '#1b37b1',
          800: '#1c308e',
          900: '#1c2c70',
          950: '#121c43',
        },
        // Семантические цвета статусов ДЗ
        success: '#16a34a',
        warning: '#d97706',
        danger: '#dc2626',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
