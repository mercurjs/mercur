import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts", "src/vite-plugin/index.ts"],
  format: ["cjs"],
  dts: true,
  onSuccess: "cp src/index.css dist/index.css",
  clean: true,
})
