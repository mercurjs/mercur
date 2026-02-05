import { defineConfig } from "tsup"

export default defineConfig([
  {
    entry: ["src/index.ts", 'src/index.css'],
    format: ["esm"],
    dts: true,
    clean: true,
  },
  {
    entry: ["src/vite-plugin/index.ts"],
    format: ["cjs"],
    dts: true,
    outDir: "dist/vite-plugin",
  },
])
