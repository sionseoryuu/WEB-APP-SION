/** @type {import('tailwindcss').Config} */
const c = (v) => `rgb(var(${v}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        life: {
          bg: c('--life-bg'),
          surface: c('--life-surface'),
          surface2: c('--life-surface2'),
          border: c('--life-border'),
          muted: c('--life-muted'),
          text: c('--life-text'),
          soft: c('--life-soft'),
          accent: c('--life-accent'),
          'accent-dark': c('--life-accent-dark'),
        },
      },
    },
  },
  plugins: [],
};
