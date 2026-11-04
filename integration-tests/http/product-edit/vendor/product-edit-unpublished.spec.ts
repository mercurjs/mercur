import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { ProductChangeStatus } from "@mercurjs/types"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60_000)

medusaIntegrationTestRunner({
  env: { MEDUSA_FF_PRODUCT_REQUEST: "true" },
  testSuite: ({ getContainer, dbConnection, api }) => {
    describe("Vendor edits with the product request flag on", () => {
      let container: MedusaContainer
      let sellerHeaders: { headers: Record<string, string> }

      beforeAll(async () => {
        container = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, container)
        const a = await createSellerUser(container, {
          email: "unpublished-seller@test.com",
          name: "Unpublished Seller",
        })
        sellerHeaders = a.headers
      })

      const createVendorProduct = async (
        title: string,
        status?: "draft" | "proposed",
      ): Promise<string> => {
        const res = await api.post(
          `/vendor/products`,
          { title, ...(status ? { status } : {}) },
          sellerHeaders,
        )
        expect(res.status).toBe(201)
        return res.data.product.id
      }

      it.each(["draft", "proposed"] as const)(
        "applies edits to a %s product straight away",
        async (status) => {
          const productId = await createVendorProduct("Unreviewed", status)

          const res = await api.post(
            `/vendor/products/${productId}`,
            { title: "Unreviewed, edited" },
            sellerHeaders,
          )
          expect(res.status).toBe(202)
          expect(res.data.product_change.status).toBe(
            ProductChangeStatus.CONFIRMED,
          )

          const product = await api.get(
            `/vendor/products/${productId}`,
            sellerHeaders,
          )
          expect(product.data.product.title).toBe("Unreviewed, edited")
          expect(product.data.product.status).toBe(status)
        },
      )

      it("still stages edits to a published product for review", async () => {
        const productId = await createVendorProduct("Live Product")
        await api.post(`/admin/products/${productId}/confirm`, {}, adminHeaders)

        const res = await api.post(
          `/vendor/products/${productId}`,
          { title: "Live Product, edited" },
          sellerHeaders,
        )
        expect(res.status).toBe(202)
        expect(res.data.product_change.status).toBe(
          ProductChangeStatus.PENDING,
        )

        const product = await api.get(
          `/vendor/products/${productId}`,
          sellerHeaders,
        )
        expect(product.data.product.title).toBe("Live Product")
      })

      it("closes an operator's change request when the store resubmits", async () => {
        const productId = await createVendorProduct("Needs Photos")
        await api.post(
          `/admin/products/${productId}/request-changes`,
          { message: "Please add photos" },
          adminHeaders,
        )

        let product = await api.get(`/vendor/products/${productId}`, sellerHeaders)
        expect(product.data.product.change_request?.message).toBe(
          "Please add photos",
        )

        await api.post(
          `/vendor/products/${productId}`,
          { title: "Needs Photos, with photos" },
          sellerHeaders,
        )

        product = await api.get(`/vendor/products/${productId}`, sellerHeaders)
        expect(product.data.product.change_request).toBeNull()
      })
    })
  },
})
