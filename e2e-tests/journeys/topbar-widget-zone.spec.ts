import { createDashboardTest, expect, type DashboardArea } from "./fixtures"
import { E2E_ADMIN, E2E_SELLER } from "../seed"

// Each host app registers a `topbar.after` probe widget
// (hosts/<panel>/src/widgets/topbar-probe.tsx).
const credentials: Record<DashboardArea, { email: string; password: string }> = {
  admin: E2E_ADMIN,
  vendor: E2E_SELLER,
}

for (const area of ["admin", "vendor"] as const) {
  const test = createDashboardTest(area)

  test.describe(`${area} topbar widget zone`, () => {
    test("is not rendered on the login page", async ({ loginPage, page }) => {
      await loginPage.goto()

      await expect(loginPage.emailInput).toBeVisible()
      await expect(page.getByTestId("topbar-widget-probe")).toHaveCount(0)
    })

    test("renders on main and settings pages", async ({ loginPage, page }) => {
      const { email, password } = credentials[area]
      await loginPage.goto()
      await loginPage.login(email, password)
      await page.waitForURL((url) => !url.pathname.startsWith("/login"))

      await page.goto("/orders")
      await expect(page.getByTestId("topbar-widget-probe")).toBeVisible()

      await page.goto("/settings/profile")
      await expect(page.getByTestId("topbar-widget-probe")).toBeVisible()
    })
  })
}
