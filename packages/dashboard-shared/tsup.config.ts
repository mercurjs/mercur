import { defineConfig } from "tsup";
import path from "path";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/index.ts"],
  format: ["esm"],
  esbuildOptions(options) {
    options.jsx = "automatic";
    options.alias = {
      "@components": path.resolve("src/components"),
      "@hooks": path.resolve("src/hooks"),
      "@lib": path.resolve("src/lib"),
      "@": path.resolve("src"),
    };
  },
  external: ["react", "react-dom", "virtual:mercur/config", "virtual:mercur/routes"],
});
