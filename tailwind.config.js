/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#2b2118', paper: '#f3e7d1', paper2: '#e8d6b6', rust: '#9c4a33',
        mustard: '#c49a3c', wood: '#6b4a2f', night: '#141a24', dust: '#b49a7a'
      },
      fontFamily: { ruqaa: ['"Aref Ruqaa"', 'serif'], naskh: ['"Noto Naskh Arabic"', 'serif'] }
    }
  },
  plugins: []
};
