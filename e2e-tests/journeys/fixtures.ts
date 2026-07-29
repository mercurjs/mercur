import { readFileSync } from "fs"
import { test as base, expect } from "@playwright/test"
import { STACK_STATE_FILE } from "../src/stack/paths"
import { LoginPage } from "./pages/login.page"

export interface StackUrls {
  medusa: string
  admin: string
  vendor: string
}

export type DashboardArea = "admin" | "vendor"

export function stackUrls(): StackUrls {
  return JSON.parse(readFileSync(STACK_STATE_FILE, "utf-8"))
}

interface DashboardFixtures {
  loginPage: LoginPage
}

// The stack runs Medusa + both dashboards on random ports (written to
// .stack.json by global-setup), so baseURL cannot be static in the config.
// Each dashboard flow builds its own `test` bound to that panel's baseURL, so
// specs stay URL-free and use page.goto("/login") etc. Future vendor flows call
// createDashboardTest("vendor"); the admin flow below is the reference.
export function createDashboardTest(area: DashboardArea) {
  return base.extend<DashboardFixtures>({
    // eslint-disable-next-line no-empty-pattern
    baseURL: async ({}, use) => {
      await use(stackUrls()[area])
    },
    loginPage: async ({ page }, use) => {
      await use(new LoginPage(page))
    },
  })
}

export { expect }
