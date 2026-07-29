import { defineConfig, devices } from "@playwright/test"

// No webServer block and no static baseURL: the stack is owned programmatically
// by global-setup.ts (Medusa + both dashboards on random ports). Each spec binds
// its own baseURL via createDashboardTest() in journeys/fixtures.ts.
export default defineConfig({
  testDir: "./journeys",
  testMatch: "**/*.spec.ts",

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // The stack seeds shared DB state and runs one Medusa instance, so specs are
  // not isolated per-worker — they run serially rather than fullyParallel.
  workers: 1,
  fullyParallel: false,

  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",

  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"]]
    : [["list"], ["html", { open: "never" }]],

  use: {
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
})
