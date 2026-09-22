const path = require("path")

const medusaUI = path.join(
  path.dirname(require.resolve("@medusajs/ui")),
  "**/*.{js,jsx,ts,tsx}"
)

const dashboardShared = path.join(
  __dirname,
  "../dashboard-shared/src/**/*.{js,jsx,ts,tsx}"
)

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@medusajs/ui-preset")],
  content: ["./src/**/*.{js,ts,jsx,tsx}", medusaUI, dashboardShared],
  darkMode: "class",
  theme: {
    extend: {
      transitionTimingFunction: {
        // Strong ease-out; the built-in curves are too weak to read as
        // intentional on the sidebar collapse.
        sidebar: "cubic-bezier(0.2, 0, 0, 1)",
      },
    },
  },
  plugins: [],
}
