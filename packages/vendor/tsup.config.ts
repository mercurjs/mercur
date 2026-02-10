import { defineConfig } from "tsup";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/index.ts", "src/index.css"],
  format: ["esm"],
  external: ["react", "react-dom", "virtual:mercur/config", "virtual:mercur/routes", "virtual:mercur/components", "virtual:mercur/menu-items", "virtual:mercur/i18n"],
});
