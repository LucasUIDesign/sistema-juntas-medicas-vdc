/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // VDC Corporate Colors
        'vdc-navy': '#003366',
        'vdc-primary': '#007BFF',
        'vdc-success': '#28A745',
        'vdc-secondary': '#6C757D',
        'vdc-error': '#FF0000',
        'vdc-bg': '#F5F5F5',
        'vdc-sidebar': '#E9ECEF',
        'vdc-row-alt': '#F8F9FA',
        // Logo colors
        'vdc-green': '#28A745',
        'vdc-blue': '#007BFF',
        'vdc-gray': '#6C757D',
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
      fontSize: {
        'body': '16px',
        'title': '24px',
        'subtitle': '20px',
      },
      boxShadow: {
        'card': '0 2px 4px rgba(0,0,0,0.1)',
        'card-hover': '0 4px 8px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        'card': '8px',
      },
      spacing: {
        'card': '20px',
      },
      animation: {
        'bounce-subtle': 'bounce-subtle 0.2s ease-in-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
        'spin-slow': 'spin 1.5s linear infinite',
      },
      keyframes: {
        'bounce-subtle': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
