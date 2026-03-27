const path = require("path")

const medusaUI = path.join(
  path.dirname(require.resolve("@medusajs/ui")),
  "**/*.{js,jsx,ts,tsx}"
)

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@medusajs/ui-preset")],
  content: ["./src/**/*.{js,ts,jsx,tsx}", medusaUI],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [],
}
