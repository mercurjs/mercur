import { expect, test } from "@playwright/test"

test.describe("vendor login page", () => {
  test("renders the email and password fields", async ({ page }) => {
    await page.goto("/login")

    await expect(page.getByRole("heading")).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole("button", { name: /sign in|log in|continue/i })).toBeVisible()
  })

  test("shows a validation error when submitting empty form", async ({ page }) => {
    await page.goto("/login")
    await page.getByRole("button", { name: /sign in|log in|continue/i }).click()

    await expect(page.getByText(/please enter/i).first()).toBeVisible()
  })
})
