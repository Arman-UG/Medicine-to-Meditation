import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#FDFDFB',
          100: '#FBFBF7',
          200: '#F7F6F0',
          300: '#EFECE2',
          400: '#E5E1D4',
        },
        sage: {
          50: '#F5F7F5',
          100: '#E6ECE6',
          200: '#CFDCDB',
          300: '#B2C6B5',
          400: '#8BA892',
          500: '#698A72',
          600: '#526F5B',
          700: '#3D5444',
          800: '#2A3C2F',
          900: '#1B2920',
        },
        forest: {
          DEFAULT: '#1E352F',
          dark: '#142520',
          light: '#28473F',
          card: '#223C35',
          muted: '#2E4941',
        },
        earth: {
          oat: '#F1EDE6',
          sand: '#EAE4D8',
          mist: '#E8EBE8',
          lavender: '#EAE6F0',
          charcoal: '#1A2922',
          muted: '#63756A',
          subtle: '#8C9D92',
        }
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'breathe-slow': 'breathe 8s ease-in-out infinite',
        'breathe-in': 'breatheIn 4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'breathe-out': 'breatheOut 6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'pulse-gentle': 'pulseGentle 4s ease-in-out infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.85' },
          '50%': { transform: 'scale(1.22)', opacity: '1' },
        },
        pulseGentle: {
          '0%, 100%': { transform: 'scale(0.98)', opacity: '0.8' },
          '50%': { transform: 'scale(1.02)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
};

export default config;
