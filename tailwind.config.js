/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        bg: {
          primary: '#0A1628',
          secondary: '#0F1F38',
          tertiary: '#152A47',
          card: 'rgba(21, 42, 71, 0.6)',
        },
        border: {
          glow: 'rgba(24, 144, 255, 0.3)',
          default: 'rgba(71, 114, 160, 0.2)',
        },
        primary: {
          50: '#E6F4FF',
          100: '#BFE0FF',
          200: '#95CBFF',
          300: '#63B3FF',
          400: '#3399FF',
          500: '#1890FF',
          600: '#096DD9',
          700: '#0050B3',
          800: '#003A8C',
          900: '#002766',
        },
        success: {
          400: '#73D13D',
          500: '#52C41A',
          600: '#389E0D',
        },
        warning: {
          400: '#FFC53D',
          500: '#FAAD14',
          600: '#D48806',
        },
        danger: {
          400: '#FF4D4F',
          500: '#F5222D',
          600: '#CF1322',
        },
        text: {
          primary: '#E6F0FF',
          secondary: '#8FA3BF',
          tertiary: '#5C7799',
        },
      },
      fontFamily: {
        rajdhani: ['Rajdhani', 'system-ui', 'sans-serif'],
        sans: ['"Source Han Sans CN"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(24, 144, 255, 0.25)',
        'glow-green': '0 0 20px rgba(82, 196, 26, 0.25)',
        'glow-orange': '0 0 20px rgba(250, 173, 20, 0.25)',
        'glow-red': '0 0 20px rgba(245, 34, 45, 0.25)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.3)',
      },
      backgroundImage: {
        'grid-tech': "linear-gradient(rgba(24, 144, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(24, 144, 255, 0.04) 1px, transparent 1px)",
        'gradient-card': 'linear-gradient(135deg, rgba(24, 144, 255, 0.08) 0%, rgba(21, 42, 71, 0.6) 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 8px rgba(24, 144, 255, 0.3)' },
          '100%': { boxShadow: '0 0 24px rgba(24, 144, 255, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};
