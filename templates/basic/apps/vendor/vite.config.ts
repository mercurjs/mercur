import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { dashboardPlugin } from '@mercurjs/dashboard-sdk'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), dashboardPlugin()],
})
