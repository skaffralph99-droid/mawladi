/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mw: { bg: '#0C0A06', card: '#161310', elevated: '#1E1A14', border: '#2A2520', steel: '#E8E0D0', dim: '#7A7060', amber: '#F59E0B', gold: '#D4A830', green: '#22C55E', red: '#EF4444' },
      },
    },
  },
  plugins: [],
}
