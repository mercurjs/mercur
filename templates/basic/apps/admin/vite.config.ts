import inject from "@medusajs/admin-vite-plugin"
import { mercurApp } from "@mercurjs/vite-plugin"
import react from "@vitejs/plugin-react"
import path from "path"
import { defineConfig, loadEnv } from "vite"

const coreAdminPath = path.resolve(__dirname, "../../../../packages/core-admin")

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [
      react(),
      inject({ sources: [] }),
      mercurApp({ type: "admin", pagesDir: "src/pages" }),
    ],
    resolve: {
      alias: [
        { find: "@mercurjs/core-admin/styles.css", replacement: path.resolve(coreAdminPath, "src/index.css") },
        { find: /^@mercurjs\/core-admin$/, replacement: path.resolve(coreAdminPath, "src/app.tsx") },
        { find: "@custom-types", replacement: path.resolve(coreAdminPath, "src/types") },
        { find: "@hooks", replacement: path.resolve(coreAdminPath, "src/hooks") },
        { find: "@components", replacement: path.resolve(coreAdminPath, "src/components") },
        { find: "@pages", replacement: path.resolve(coreAdminPath, "src/pages") },
        { find: "@utils", replacement: path.resolve(coreAdminPath, "src/utils") },
        { find: "@assets", replacement: path.resolve(coreAdminPath, "src/assets") },
        { find: "@styles", replacement: path.resolve(coreAdminPath, "src/styles") },
        { find: "@lib", replacement: path.resolve(coreAdminPath, "src/lib") },
        { find: "@providers", replacement: path.resolve(coreAdminPath, "src/providers") },
        { find: "@", replacement: path.resolve(coreAdminPath, "src") },
      ],
    },
    define: {
      __BASE__: JSON.stringify(env.VITE_MEDUSA_BASE || "/"),
      __BACKEND_URL__: JSON.stringify(env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000"),
      __STOREFRONT_URL__: JSON.stringify(env.VITE_MEDUSA_STOREFRONT_URL || "http://localhost:8000"),
      __B2B_PANEL__: JSON.stringify(env.VITE_MEDUSA_B2B_PANEL || "false"),
      __TALK_JS_APP_ID__: JSON.stringify(env.VITE_TALK_JS_APP_ID || undefined),
    },
    server: {
      fs: {
        allow: [path.resolve(__dirname, "../../../..")],
      },
    },
  }
})
