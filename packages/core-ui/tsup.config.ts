import { defineConfig } from "tsup"

export default defineConfig([
  {
    entry: ['src/index.css', 'src/app.tsx', 'src/index.ts'],
    format: ["esm"],
    dts: true,
    clean: true,
    external: ['virtual:mercur/routes', 'virtual:mercur/config'],
  },
  {
    entry: ["src/vite-plugin/index.ts"],
    format: ["cjs"],
    dts: true,
    clean: true,
    outDir: "dist/vite-plugin",
  },
])
