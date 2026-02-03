import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/index.ts", "src/react/index.ts"],
  format: ["cjs"], // TS plugins must be CommonJS
  sourcemap: true,
  target: "es2020",
  outDir: "dist",
  treeshake: true,
  external: ["typescript"],
});
