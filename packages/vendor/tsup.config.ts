import { defineConfig } from "tsup";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/index.ts", "src/index.css"],
  format: ["esm"],
  external: ["react", "react-dom", "virtual:mercur/config", "virtual:medusa/links", "@medusajs/admin-shared", "virtual:mercur/routes", "virtual:mercur/components"],
  esbuildOptions(options) {
    options.alias = {
      "@": resolve(__dirname, "src"),
      "@components": resolve(__dirname, "src/components"),
      "@hooks": resolve(__dirname, "src/hooks"),
      "@lib": resolve(__dirname, "src/lib"),
      "@pages": resolve(__dirname, "src/pages"),
      "@providers": resolve(__dirname, "src/providers"),
      "@assets": resolve(__dirname, "src/assets"),
    };
  },
});
