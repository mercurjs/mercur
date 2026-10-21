import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"

import { createSellerUser } from "../../../helpers/create-seller-user"
import {
  assignProductsToSeller,
  createVendorProduct,
} from "../../../helpers/create-product"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Vendor - product variant list scoping", () => {
      let appContainer: MedusaContainer
      let sellerB: any
      let headersA: any
      let headersB: any

      beforeAll(() => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        const a = await createSellerUser(appContainer, {
          email: "variants-a@test.com",
          name: "Variants A Store",
        })
        headersA = a.headers
        const b = await createSellerUser(appContainer, {
          email: "variants-b@test.com",
          name: "Variants B Store",
        })
        sellerB = b.seller
        headersB = b.headers
      })

      const variantIds = async (headers: any) => {
        const response = await api.get(
          "/vendor/product-variants?limit=100",
          headers
        )
        expect(response.status).toEqual(200)
        return response.data.variants.map((v: { id: string }) => v.id)
      }

      it("lists the seller's own proposed variants plus published ones", async () => {
        const proposedByA = await createVendorProduct(api, headersA, {
          title: "A Proposed",
          status: "proposed",
          sku: "A-PROPOSED",
        })
        const published = await createVendorProduct(api, headersB, {
          title: "B Published",
          status: "published",
          sku: "B-PUBLISHED",
        })

        const idsA = await variantIds(headersA)
        expect(idsA).toContain(proposedByA.variants[0].id)
        expect(idsA).toContain(published.variants[0].id)

        const idsB = await variantIds(headersB)
        expect(idsB).toContain(published.variants[0].id)
        expect(idsB).not.toContain(proposedByA.variants[0].id)
      })

      it("hides variants of a published product restricted to other sellers", async () => {
        const restrictedToB = await createVendorProduct(api, headersA, {
          title: "Restricted To B",
          status: "published",
          sku: "RESTRICTED-B",
        })
        await assignProductsToSeller(appContainer, sellerB.id, [restrictedToB.id])

        const idsA = await variantIds(headersA)
        expect(idsA).not.toContain(restrictedToB.variants[0].id)

        const idsB = await variantIds(headersB)
        expect(idsB).toContain(restrictedToB.variants[0].id)
      })
    })
  },
})
