import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // هوية العيادة — وردي فاتح (زهر) وبيج، حسب اختيار الطبيبة.
        // أسماء المفاتيح (orchid/rose/champagne) ثابتة لأنها مستخدمة في كل المكونات،
        // وقيمها هي التي تحدد الهوية: orchid = الوردي الأساسي، rose = الزهري الفاتح، champagne = البيج.
        orchid: {
          50: '#FCF4F6',
          100: '#F8E9ED',
          200: '#F0D5DC',
          300: '#E0B3C0',
          400: '#C98A9D',
          500: '#A85A72',
          600: '#934C63',
          700: '#7A3E51',
          800: '#5C2F3D',
          900: '#3E2029',
        },
        rose: {
          50: '#FFF8F8',
          100: '#FDEFF0',
          200: '#F9E0E2',
          300: '#F2C9CD',
          400: '#E8B0B6',
          500: '#D6939B',
          600: '#BA7880',
          700: '#955D64',
        },
        champagne: {
          100: '#F7F0E7',
          200: '#EEDFCB',
          300: '#DFC7A7',
          400: '#C9AA84',
          500: '#93724D',
          600: '#7A5E3F',
        },
        canvas: '#FFFBF8',
        ink: '#2E2527',
        muted: '#6F6264',
        line: '#F1E5E3',
        ok: '#5E9E7A',
        warn: '#C99A4E',
        danger: '#C23F4A',
      },
      fontFamily: {
        sans: ['var(--font-arabic)', 'IBM Plex Sans Arabic', 'Tajawal', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(46,37,39,0.04), 0 8px 24px -12px rgba(168,90,114,0.18)',
        lift: '0 2px 4px rgba(46,37,39,0.04), 0 18px 40px -18px rgba(168,90,114,0.28)',
      },
      keyframes: {
        rise: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(-100%)' } },
      },
      animation: {
        rise: 'rise .5s cubic-bezier(.22,1,.36,1) both',
      },
    },
  },
  plugins: [],
};

export default config;
