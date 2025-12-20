/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#000212',
        foreground: '#ffffff',
        muted: '#b1b8c9',
        border: 'rgba(255, 255, 255, 0.08)',
        accent: {
          DEFAULT: '#ffffff',
          foreground: '#000212',
        },
        card: {
          DEFAULT: 'rgba(255, 255, 255, 0.03)',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        primary: {
          DEFAULT: '#5e6ad2',
          hover: '#707bed',
        }
      },
      backgroundImage: {
        'linear-gradient': 'linear-gradient(to bottom, rgba(255, 255, 255, 0.05), transparent)',
        'hero-gradient': 'radial-gradient(ellipse at 50% -20%, rgba(120, 119, 198, 0.3), transparent)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(120, 119, 198, 0.15)',
      }
    },
  },
  plugins: [],
}
