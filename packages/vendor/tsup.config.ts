import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/index.ts", "src/index.css"],
  format: ["esm"],
  external: ["react", "react-dom", "virtual:mercur/config", "virtual:mercur/routes", "virtual:mercur/components", "virtual:mercur/menu-items"],
});
