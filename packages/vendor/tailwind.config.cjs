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
      keyframes: {
        "login-reveal": {
          from: {
            opacity: "0",
            transform: "translateY(8px)",
            filter: "blur(4px)",
          },
          to: { opacity: "1", transform: "none", filter: "none" },
        },
        "login-alert": {
          from: {
            opacity: "0",
            transform: "translateY(-4px) scale(0.98)",
            filter: "blur(2px)",
          },
          to: { opacity: "1", transform: "none", filter: "none" },
        },
        "login-fade": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        // Keyframes rather than motion/react: the WAAPI handoff at the end of a
        // JS-driven reveal flickers for a frame once the inline styles commit.
        "login-reveal":
          "login-reveal 450ms cubic-bezier(0.23, 1, 0.32, 1) both",
        "login-alert": "login-alert 250ms cubic-bezier(0.23, 1, 0.32, 1)",
        "login-fade": "login-fade 300ms ease-out both",
      },
    },
  },
  plugins: [],
}
