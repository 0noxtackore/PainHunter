/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#FEF1F1',
          100: '#FDDEDE',
          200: '#F9B9BA',
          300: '#F48D8F',
          400: '#EE5A5E',
          500: '#E02030',
          600: '#C31422',
          700: '#9E0F1A',
          800: '#7D0E17',
          900: '#5C1015',
        },
      },
    },
  },
  plugins: [],
};
