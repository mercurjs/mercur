const path = require('path')

const medusaUI = path.join(
  path.dirname(require.resolve('@medusajs/ui')),
  '**/*.{js,jsx,ts,tsx}'
)

/** @type {import('tailwindcss').Config} */
export default {
  presets: [require('@medusajs/ui-preset')],
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}', medusaUI],
  theme: {
  	extend: {
  		colors: {
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		}
  	}
  },
  plugins: [require('tailwindcss-animate')]
}
