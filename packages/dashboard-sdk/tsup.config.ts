import { defineConfig } from "tsup"

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ["esm"],
    dts: true,
    clean: true,
  },
  {
    entry: ["src/vite-plugin/index.ts"],
    format: ["cjs"],
    dts: true,
    clean: true,
    outDir: "dist/vite-plugin",
  },
])
