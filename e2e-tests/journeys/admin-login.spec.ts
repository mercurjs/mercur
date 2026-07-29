import { createDashboardTest, expect } from "./fixtures"
import { E2E_ADMIN } from "../seed"

// Reference admin flow. Demonstrates the patterns every future e2e flow follows:
// a per-area test bound to the panel baseURL, a page object for actions, one
// behavior per test, and web-first assertions owned by the test.
const test = createDashboardTest("admin")

test.describe("admin authentication", () => {
  test("valid credentials reach the dashboard", async ({ loginPage, page }) => {
    await loginPage.goto()
    await loginPage.login(E2E_ADMIN.email, E2E_ADMIN.password)

    await page.waitForURL((url) => !url.pathname.startsWith("/login"))
    await expect(loginPage.emailInput).toBeHidden()
  })

  test("invalid credentials stay on the login page", async ({ loginPage, page }) => {
    await loginPage.goto()
    await loginPage.login(E2E_ADMIN.email, "wrong-password")

    await expect(page).toHaveURL(/\/login/)
    await expect(loginPage.emailInput).toBeVisible()
  })
})
