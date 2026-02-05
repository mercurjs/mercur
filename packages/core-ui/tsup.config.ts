import { defineConfig } from "tsup"

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/index.css'],
    format: ["esm"],
    dts: true,
    clean: true,
    external: ['virtual:mercur/routes', 'virtual:mercur/config', 'virtual:mercur/components'],
  },
  {
    entry: ["src/vite-plugin/index.ts"],
    format: ["cjs"],
    dts: true,
    clean: true,
    outDir: "dist/vite-plugin",
  },
])
