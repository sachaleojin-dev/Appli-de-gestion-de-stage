import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#faf8f6',
        foreground: '#2c2420',
        primary: '#e8a8b0',
        'primary-light': '#f5d5db',
        secondary: '#d4c5bb',
        accent: '#f5c5a8',
        success: '#a8d4c5',
        border: '#e5d9cf',
        muted: '#d4c5bb',
        'muted-foreground': '#8b7f74',
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '4px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
export default config
