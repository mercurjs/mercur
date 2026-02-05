import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mercurVendorPlugin } from '@mercurjs/dashboard-sdk/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mercurVendorPlugin()],
})
