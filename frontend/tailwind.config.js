module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          green: '#00FF41',
          blue: '#00F0FF',
          dark: '#0a1414',
          'dark-lighter': '#142828',
          accent: '#7000FF'
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    }
  },
  plugins: []
};
