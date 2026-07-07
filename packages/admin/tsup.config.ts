import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/index.ts", "src/index.css", 'src/pages/index.ts'],
  format: ["esm"],
  external: ["react", "react-dom", "virtual:mercur/config", "virtual:mercur/routes", "virtual:mercur/menu-items", "virtual:mercur/i18n", "virtual:mercur/widgets", "virtual:mercur/navigation", "virtual:mercur/custom-fields"],
});
