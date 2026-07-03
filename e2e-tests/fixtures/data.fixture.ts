import { test as authTest } from "./auth.fixture"
import { createProduct, deleteProduct, type Product } from "../helpers/api"
import { generateProduct } from "../helpers/test-data"

type DataFixtures = {
  seededProduct: Product
}

/**
 * Fixtures that seed entities via the API and tear them down after the test
 * (teardown runs even on failure — that's the point of using a fixture).
 *
 * Add new entities here as needed: `seededOrder`, `seededCustomer`, etc.
 */
export const test = authTest.extend<DataFixtures>({
  seededProduct: async ({ apiRequest }, use) => {
    const product = await createProduct(apiRequest, generateProduct())
    await use(product)
    await deleteProduct(apiRequest, product.id)
  },
})

export { expect } from "@playwright/test"
