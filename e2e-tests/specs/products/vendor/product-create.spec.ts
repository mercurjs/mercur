import { test, expect } from "../../../fixtures/base.fixture"
import { generateProduct } from "../../../helpers/test-data"

test.describe("Vendor — product create", () => {
  test("opens the product create form and accepts a title", async ({ page }) => {
    const product = generateProduct({ title: `E2E Product ${Date.now()}` })

    await page.goto("/products")
    // Create CTA is rendered as a <Link> via `Button asChild`, so it has
    // role="link" in the accessibility tree, not "button".
    await page.getByRole("link", { name: /create/i }).click()

    // Radix renders the FocusModal content twice for accessibility; the
    // last copy is the interactive one.
    const titleInput = page
      .getByTestId("product-create-general-section-title-input")
      .last()
    await expect(titleInput).toBeVisible()
    await titleInput.fill(product.title)
    await expect(titleInput).toHaveValue(product.title)
  })

  test("renders a pre-seeded product on the detail page", async ({
    page,
    seededProduct,
  }) => {
    await page.goto(`/products/${seededProduct.id}`)

    await expect(
      page.getByRole("heading", { name: seededProduct.title }),
    ).toBeVisible()
  })
})
