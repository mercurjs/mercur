import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.tsx", "src/vite-plugin/index.ts"],
  format: ["esm"],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: [
    "react",
    "react-dom",
    "virtual:mercur/config",
    "virtual:mercur/routes",
  ],
  esbuildOptions(options) {
    options.jsx = "automatic"
  },
})
