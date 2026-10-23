/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#0b2545',
          navyDark: '#07182c',
          saffron: '#ff9933',
          saffronDark: '#e67300',
          green: '#138808',
          ash: '#f4f6f8',
          card: '#ffffff',
          border: '#dbe2ea',
          text: '#1a202c',
          muted: '#64748b',
        },
        priority: {
          critical: '#dc2626',
          high: '#ea580c',
          medium: '#d97706',
          low: '#2563eb',
        },
        bucket: {
          autoflag: '#dc2626',
          review: '#d97706',
          info: '#4b5563',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans"', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
