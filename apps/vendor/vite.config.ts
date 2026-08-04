import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { mercurDashboardPlugin } from '@mercurjs/dashboard-sdk/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl =
    env.VITE_MERCUR_BACKEND_URL || env.MERCUR_BACKEND_URL

  return {
    resolve: {
      alias: {
        // `@mercurjs/vendor/extension-targets` is a build-time marker module the
        // dashboard-sdk emits (imported by `_navigation.ts` and every widget).
        // Vite's dev resolution of that `exports` subpath on the linked workspace
        // package is racy — it intermittently throws "Failed to resolve import ...
        // Does the file exist?" and blanks the app. Pin the exact specifier to the
        // same file the exports map points to so resolution is deterministic.
        '@mercurjs/vendor/extension-targets': path.join(
          rootDir,
          'node_modules/@mercurjs/vendor/dist/extension-targets.js',
        ),
      },
    },
    plugins: [
      react(),
      mercurDashboardPlugin({
        medusaConfigPath: '../api/medusa-config.ts',
        ...(backendUrl ? { backendUrl } : {}),
      }),
    ],
  }
})
