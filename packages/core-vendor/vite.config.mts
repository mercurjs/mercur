import react from "@vitejs/plugin-react"
import path from "path"
import { defineConfig, loadEnv, Plugin } from "vite"

/**
 * Simple plugin to provide empty virtual modules for the extension system.
 * These would normally be provided by the medusa admin vite plugin.
 */
function emptyVirtualModules(): Plugin {
  const virtualModules: Record<string, string> = {
    "virtual:medusa/displays": "export default { displays: {} }",
    "virtual:medusa/forms": "export default { customFields: {} }",
    "virtual:medusa/menu-items": "export default { menuItems: [] }",
    "virtual:medusa/widgets": "export default { widgets: [] }",
    "virtual:medusa/links": "export default { links: {} }",
    "virtual:medusa/routes": "export default { routes: [] }",
  }

  return {
    name: "empty-virtual-modules",
    resolveId(id) {
      if (id in virtualModules) {
        return id
      }
    },
    load(id) {
      if (id in virtualModules) {
        return virtualModules[id]
      }
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  const BASE = env.VITE_MEDUSA_BASE || "/"
  const BACKEND_URL = env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000"
  const STOREFRONT_URL =
    env.VITE_MEDUSA_STOREFRONT_URL || "http://localhost:8000"
  const PUBLISHABLE_API_KEY = env.VITE_PUBLISHABLE_API_KEY || ""
  const TALK_JS_APP_ID = env.VITE_TALK_JS_APP_ID || ""
  const DISABLE_SELLERS_REGISTRATION =
    env.VITE_DISABLE_SELLERS_REGISTRATION || "false"

  return {
    plugins: [react(), emptyVirtualModules()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@components": path.resolve(__dirname, "src/components"),
        "@hooks": path.resolve(__dirname, "src/hooks"),
        "@lib": path.resolve(__dirname, "src/lib"),
        "@providers": path.resolve(__dirname, "src/providers"),
        "@pages": path.resolve(__dirname, "src/pages"),
        "@custom-types": path.resolve(__dirname, "src/types"),
      },
    },
    define: {
      __BASE__: JSON.stringify(BASE),
      __BACKEND_URL__: JSON.stringify(BACKEND_URL),
      __STOREFRONT_URL__: JSON.stringify(STOREFRONT_URL),
      __PUBLISHABLE_API_KEY__: JSON.stringify(PUBLISHABLE_API_KEY),
      __TALK_JS_APP_ID__: JSON.stringify(TALK_JS_APP_ID),
      __DISABLE_SELLERS_REGISTRATION__: JSON.stringify(
        DISABLE_SELLERS_REGISTRATION
      ),
    },
    server: {
      open: true,
    },
    optimizeDeps: {
      entries: [],
      include: ["recharts"],
    },
  }
})
