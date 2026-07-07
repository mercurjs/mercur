import { defineConfig } from "tsup"

export default defineConfig({
    entry: ["src/index.ts", "src/vite.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    external: ["zod", "react"],
})
