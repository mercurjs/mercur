import { defineConfig, devices } from "@playwright/test"

const VENDOR_URL = process.env.VENDOR_URL ?? "http://localhost:7001"
const API_URL = process.env.API_URL ?? "http://localhost:9000"
const REUSE_SERVERS = !process.env.CI

export default defineConfig({
  testDir: "./specs",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html"]] : "html",
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: VENDOR_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "vendor",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/vendor.json",
      },
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
    },
  ],

  webServer: [
    {
      command: "bun run dev",
      cwd: "../apps/api",
      url: `${API_URL}/health`,
      reuseExistingServer: REUSE_SERVERS,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 180_000,
    },
    {
      command: "bun run dev",
      cwd: "../apps/vendor",
      url: VENDOR_URL,
      reuseExistingServer: REUSE_SERVERS,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 120_000,
    },
  ],
})
