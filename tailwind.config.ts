import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F7F3EE',
        surface: '#FFFFFF',
        coffee: {
          DEFAULT: '#6F4E37',
          50: '#F5EDE7',
          100: '#E8D8CB',
          200: '#D0B29B',
          300: '#B58B6A',
          400: '#8E6547',
          500: '#6F4E37',
          600: '#5A3F2C',
          700: '#432F21',
          800: '#2E2016',
          900: '#1A130D',
        },
        ink: '#2B2018',
        muted: '#7A6E64',
        line: '#EAE1D6',
        success: '#3E7C5A',
        error: '#C0492F',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(43, 32, 24, 0.06), 0 2px 8px rgba(43, 32, 24, 0.04)',
        soft: '0 8px 24px rgba(43, 32, 24, 0.08)',
      },
    },
  },
  plugins: [],
};
export default config;
