/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF9900',
          deep: '#E68500',
          warm: '#FFA733'
        },
        neutral: {
          black: '#000000',
          white: '#FFFFFF',
          charcoal: '#222222',
          lightGray: '#EAEAEA',
          cream: '#FFF3D8'
        },
        status: {
          success: '#28A745',
          warning: '#FFC107',
          error: '#DC3545'
        },
        surface: '#FFFFFF',
        page: '#FAFAFA',
        muted: '#737373'
      },
      fontFamily: {
        heading: ['"Baloo 2"', 'cursive'],
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem'
      },
      boxShadow: {
        'soft-lg': '0 10px 30px rgba(0,0,0,0.35)'
      }
    }
  },
  plugins: []
};