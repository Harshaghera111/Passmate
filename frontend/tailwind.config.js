/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: {
          base: '#F7F8FA',
          surface: '#FFFFFF',
          muted: '#EFF1F5',
        },
        border: '#E2E5EC',
        text: {
          primary: '#0F1117',
          secondary: '#5A6173',
          muted: '#9BA3B2',
        },
        accent: {
          primary: '#2F6FED',
          secondary: '#10B981',
          danger: '#EF4444',
          warning: '#F59E0B',
          purple: '#7C3AED',
        },
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        md: '0 4px 16px rgba(0,0,0,0.08)',
        xl: '0 20px 40px rgba(47,111,237,0.12)',
        card: '0 2px 8px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
        badge: '999px',
        input: '8px',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-badge': 'pulse-badge 2s ease-in-out infinite',
        'fade-up': 'fade-up 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.25s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-badge': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        scan: {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        },
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, #2F6FED 0%, #1E40AF 100%)',
        'gradient-card': 'linear-gradient(135deg, #2F6FED 0%, #7C3AED 100%)',
      },
    },
  },
  plugins: [],
}
