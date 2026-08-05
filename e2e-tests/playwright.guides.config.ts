import { defineConfig, devices } from "@playwright/test"

// Docs guide generator. Separate from playwright.config.ts (the e2e journeys)
// because it seeds a different dataset (the apps/api demo catalog) and its
// "tests" are generators that write screenshots + MDX into apps/docs rather than
// assert behavior. Run with: bun run guides (see package.json).
export default defineConfig({
  testDir: "./guides",
  testMatch: "**/generate.spec.ts",

  // Generation is inherently serial: one seeded Medusa instance, shared DB
  // state, and deterministic screenshot output.
  workers: 1,
  fullyParallel: false,
  // Never retry a generation run; a failure means the UI drifted and the guide
  // author should look, not paper over it with a retry.
  retries: 0,

  globalSetup: "./guides/global-setup.guides.ts",
  globalTeardown: "./guides/global-teardown.guides.ts",

  // Generous timeout: a guide can have many steps, each with a network wait.
  timeout: 180_000,
  expect: { timeout: 10_000 },

  reporter: [["list"]],

  use: {
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    // Deterministic, high-DPI screenshots for crisp docs images. Force the dark
    // theme to match the docs site's dark-first palette.
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
    trace: "on-first-retry",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
})
