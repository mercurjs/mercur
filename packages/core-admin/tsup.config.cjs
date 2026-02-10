import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["./src/app.tsx"],
  format: ["cjs", "esm"],
  external: [
    "virtual:medusa/forms",
    "virtual:medusa/displays",
    "virtual:medusa/routes",
    "virtual:medusa/links",
    "virtual:medusa/menu-items",
    "virtual:medusa/widgets",
    "virtual:mercur-navigation",
  ],
  tsconfig: "tsconfig.build.json",
  clean: true,
})
