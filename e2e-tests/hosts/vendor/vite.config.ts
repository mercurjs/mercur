import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import { mercurDashboardPlugin } from "@mercurjs/dashboard-sdk/vite"

// Mirrors apps/vendor/vite.config.ts. The backend URL is injected by the e2e
// stack through VITE_MERCUR_BACKEND_URL when it spawns this dev server.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const backendUrl = env.VITE_MERCUR_BACKEND_URL || env.MERCUR_BACKEND_URL

  return {
    plugins: [
      react(),
      mercurDashboardPlugin({
        medusaConfigPath: "../../medusa-config.ts",
        ...(backendUrl ? { backendUrl } : {}),
      }),
    ],
  }
})
