/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontSize: {
        // Custom sizes for micro text (badges, chips, kbd hints)
        micro: ['11px', { lineHeight: '16px' }],
        mini: ['10px', { lineHeight: '14px' }],
      },
      colors: {
        // ForgeComply 360 brand colors from logo
        forge: {
          navy: {
            DEFAULT: '#1a2744',
            50: '#f0f4f8',
            100: '#d9e2ec',
            200: '#bcccdc',
            300: '#9fb3c8',
            400: '#829ab1',
            500: '#627d98',
            600: '#486581',
            700: '#334e68',
            800: '#243b53',
            900: '#1a2744',
            950: '#102a43',
          },
          green: {
            DEFAULT: '#84cc16',
            50: '#f7fee7',
            100: '#ecfccb',
            200: '#d9f99d',
            300: '#bef264',
            400: '#a3e635',
            500: '#84cc16',
            600: '#65a30d',
            700: '#4d7c0f',
            800: '#3f6212',
            900: '#365314',
          },
        },
      },
    },
  },
  plugins: [],
};
