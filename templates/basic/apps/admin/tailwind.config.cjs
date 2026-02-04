const path = require("path")

// Path to core-admin package
const coreAdminPath = path.resolve(__dirname, "../../../../packages/core-admin")

// Path to @medusajs/ui
const medusaUI = path.join(
  path.dirname(require.resolve("@medusajs/ui")),
  "**/*.{js,jsx,ts,tsx}"
)

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@medusajs/ui-preset")],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Include core-admin source files
    path.join(coreAdminPath, "src/**/*.{js,ts,jsx,tsx}"),
    // Include @medusajs/ui
    medusaUI,
  ],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [],
}
