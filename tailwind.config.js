/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        dswd: {
          blue: '#2e3192',
          'blue-dark': '#23256f',
          yellow: '#fef200',
          'yellow-soft': '#fff9b8',
          red: '#ee1c25',
          'red-dark': '#b9151c',
          canvas: '#f6f7ff'
        }
      },
      boxShadow: {
        card: '0 12px 36px rgba(46, 49, 146, 0.06)',
        float: '0 18px 48px rgba(35, 37, 111, 0.14)'
      }
    }
  },
  plugins: []
};
