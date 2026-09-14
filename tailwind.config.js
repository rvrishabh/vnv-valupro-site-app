/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['PlusJakartaSans-Regular'],
        medium: ['PlusJakartaSans-Medium'],
        semibold: ['PlusJakartaSans-SemiBold'],
        bold: ['PlusJakartaSans-Bold'],
        extrabold: ['PlusJakartaSans-ExtraBold'],
      },
      // Mirrors src/theme/colors.ts — the VNV admin palette (navy + gold).
      colors: {
        background: '#061533',
        foreground: '#F7F7F5',
        surface: '#0A1F44',
        surfaceVariant: '#15305F',
        glass: 'rgba(255, 255, 255, 0.06)',
        glassBorder: 'rgba(255, 255, 255, 0.12)',
        primary: '#C9A84C',
        primaryForeground: '#061533',
        muted: '#15305F',
        mutedForeground: '#B7CBE0',
        success: '#22C55E',
        warning: '#F59E0B',
        destructive: '#EF4444',
        info: '#6E9AF7',
        border: 'rgba(255, 255, 255, 0.14)',
      },
    },
  },
  plugins: [],
};
