/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neumorphism base colors - soft, muted palette
        'neu': {
          50: '#FAFBFC',
          100: '#F0F2F5',
          200: '#E4E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        // Chat panel specific
        'chat': {
          bg: '#DFECF4',
          shadow: '#6C8DC2',
        },
        // Dark graffiti neumorphism
        'dark-neu': {
          50: '#4A5568',
          100: '#3D4555',
          200: '#2D3748',
          300: '#252D3A',
          400: '#1E2530',
          500: '#171C26',
          600: '#12161D',
          700: '#0D1117',
          800: '#0A0D12',
          900: '#06080B',
        },
        // Political leaning colors - muted for neumorphism
        'liberal': {
          light: '#5B9FD8',
          DEFAULT: '#4A8DC7',
          dark: '#3A7AB5',
        },
        'conservative': {
          light: '#E8746F',
          DEFAULT: '#D6625D',
          dark: '#C4504B',
        },
        'neutral': {
          light: '#9CA3AF',
          DEFAULT: '#6B7280',
          dark: '#4B5563',
        },
        // Accent colors - softer versions
        'accent': {
          green: '#5DBF7D',
          orange: '#F0A355',
          yellow: '#F5D15C',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.006em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.006em' }],
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.005em' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0.004em' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '0.003em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '0.002em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.002em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.003em' }],
        '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.004em' }],
        // Fluid typography with clamp() - scales between viewport sizes
        'fluid-sm': ['clamp(0.875rem, 0.8rem + 0.4vw, 1rem)', { lineHeight: '1.4' }],
        'fluid-base': ['clamp(1rem, 0.95rem + 0.25vw, 1.125rem)', { lineHeight: '1.5' }],
        'fluid-lg': ['clamp(1.125rem, 1rem + 0.5vw, 1.5rem)', { lineHeight: '1.4' }],
        'fluid-xl': ['clamp(1.25rem, 1.1rem + 0.75vw, 2rem)', { lineHeight: '1.3' }],
        'fluid-2xl': ['clamp(1.5rem, 1.3rem + 1vw, 2.5rem)', { lineHeight: '1.2' }],
        'fluid-3xl': ['clamp(1.875rem, 1.5rem + 1.5vw, 3rem)', { lineHeight: '1.1' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
      },
      borderRadius: {
        'neu': '1.25rem',
        'neu-sm': '0.75rem',
        'neu-lg': '1.75rem',
        'neu-xl': '2.25rem',
      },
      boxShadow: {
        'neu-flat': '6px 6px 12px rgba(163, 177, 198, 0.6), -6px -6px 12px rgba(255, 255, 255, 0.5)',
        'neu': '8px 8px 16px rgba(163, 177, 198, 0.6), -8px -8px 16px rgba(255, 255, 255, 0.5)',
        'neu-sm': '4px 4px 8px rgba(163, 177, 198, 0.6), -4px -4px 8px rgba(255, 255, 255, 0.5)',
        'neu-lg': '12px 12px 24px rgba(163, 177, 198, 0.6), -12px -12px 24px rgba(255, 255, 255, 0.5)',
        'neu-xl': '20px 20px 40px rgba(163, 177, 198, 0.6), -20px -20px 40px rgba(255, 255, 255, 0.5)',
        'neu-inset': 'inset 4px 4px 8px rgba(163, 177, 198, 0.5), inset -4px -4px 8px rgba(255, 255, 255, 0.5)',
        'neu-inset-sm': 'inset 2px 2px 4px rgba(163, 177, 198, 0.5), inset -2px -2px 4px rgba(255, 255, 255, 0.5)',
        // Neumorphic shadow variants for auth components
        'neumorphic': '8px 8px 16px rgba(163, 177, 198, 0.6), -8px -8px 16px rgba(255, 255, 255, 0.5)',
        'neumorphic-hover': '12px 12px 24px rgba(163, 177, 198, 0.7), -12px -12px 24px rgba(255, 255, 255, 0.6)',
        'neumorphic-inset': 'inset 4px 4px 8px rgba(163, 177, 198, 0.5), inset -4px -4px 8px rgba(255, 255, 255, 0.5)',
        // Chat panel specific shadows
        'chat-neu': '12px 12px 24px rgba(108, 141, 194, 0.5), -12px -12px 24px rgba(108, 141, 194, 0.8)',
        'chat-neu-sm': '6px 6px 12px rgba(108, 141, 194, 0.5), -6px -6px 12px rgba(108, 141, 194, 0.8)',
        'chat-neu-lg': '16px 16px 32px rgba(108, 141, 194, 0.5), -16px -16px 32px rgba(108, 141, 194, 0.8)',
        'chat-neu-inset': 'inset 6px 6px 12px rgba(108, 141, 194, 0.5), inset -6px -6px 12px rgba(108, 141, 194, 0.8)',
        // Dark graffiti neumorphism shadows - convex/raised
        'dark-neu': '8px 8px 16px rgba(0, 0, 0, 0.4), -8px -8px 16px rgba(74, 85, 104, 0.1)',
        'dark-neu-sm': '4px 4px 8px rgba(0, 0, 0, 0.4), -4px -4px 8px rgba(74, 85, 104, 0.1)',
        'dark-neu-lg': '12px 12px 24px rgba(0, 0, 0, 0.5), -12px -12px 24px rgba(74, 85, 104, 0.15)',
        'dark-neu-xl': '20px 20px 40px rgba(0, 0, 0, 0.6), -20px -20px 40px rgba(74, 85, 104, 0.2)',
        'dark-neu-inset': 'inset 4px 4px 8px rgba(0, 0, 0, 0.5), inset -4px -4px 8px rgba(74, 85, 104, 0.05)',
      },
      backgroundImage: {
        'neu-gradient': 'linear-gradient(145deg, #F0F2F5, #E4E7EB)',
        'neu-gradient-reverse': 'linear-gradient(145deg, #E4E7EB, #F0F2F5)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
}
