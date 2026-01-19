import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
    rules: {
      "consistent-return": "error",
      "indent": ["warn", 2],
      "no-else-return": "warn",
      "semi": ["warn", "always"],
      "space-unary-ops": "error",
    },
  },
  tseslint.configs.recommended,
]);
