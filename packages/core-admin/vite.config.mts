import inject from "@medusajs/admin-vite-plugin";
import { mercurApp } from "@mercurjs/vite-plugin";

import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import inspect from "vite-plugin-inspect";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  const BASE = env.VITE_MEDUSA_BASE || "/";
  const BACKEND_URL = env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000";
  const STOREFRONT_URL =
    env.VITE_MEDUSA_STOREFRONT_URL || "http://localhost:8000";
  const B2B_PANEL = env.VITE_MEDUSA_B2B_PANEL || "false";
  const TALK_JS_APP_ID = env.VITE_TALK_JS_APP_ID || undefined;

  /**
   * Add this to your .env file to specify the project to load admin extensions from.
   */
  const MEDUSA_PROJECT = env.VITE_MEDUSA_PROJECT || null;
  const sources = MEDUSA_PROJECT ? [MEDUSA_PROJECT] : [];

  return {
    plugins: [
      inspect(),
      react(),
      inject({
        sources,
      }),
      mercurApp({
        type: "admin",
        pagesDir: "src/pages",
      }),
    ],
    resolve: {
      alias: {
        "@custom-types": path.resolve(__dirname, "./src/types"),
        "@hooks": path.resolve(__dirname, "./src/hooks"),
        "@components": path.resolve(__dirname, "./src/components"),
        "@pages": path.resolve(__dirname, "./src/pages"),
        "@utils": path.resolve(__dirname, "./src/utils"),
        "@assets": path.resolve(__dirname, "./src/assets"),
        "@styles": path.resolve(__dirname, "./src/styles"),
        "@lib": path.resolve(__dirname, "./src/lib"),
        "@providers": path.resolve(__dirname, "./src/providers"),
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      __BASE__: JSON.stringify(BASE),
      __BACKEND_URL__: JSON.stringify(BACKEND_URL),
      __STOREFRONT_URL__: JSON.stringify(STOREFRONT_URL),
      __B2B_PANEL__: JSON.stringify(B2B_PANEL),
      __TALK_JS_APP_ID__: JSON.stringify(TALK_JS_APP_ID),
    },
    server: {
      open: true,
    },
  };
});
