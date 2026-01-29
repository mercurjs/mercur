import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mercurApp } from '@mercurjs/vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    mercurApp({
      type: 'admin',
      pagesDir: 'src/pages',
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
