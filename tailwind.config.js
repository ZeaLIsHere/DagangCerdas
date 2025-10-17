/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode colors
        primary: '#3B82F6',
        secondary: '#1F2937',
        accent: '#10B981',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        
        // Dark mode will be handled by CSS variables
        'dark-primary': '#FF8C32',
        'dark-secondary': '#F5F5F7',
        'dark-accent': '#0A84FF',
        'dark-success': '#30D158',
        'dark-warning': '#FF9F0A',
        'dark-error': '#FF453A',
        'dark-background': '#0D1117',
        'dark-surface': '#1E1E2A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
