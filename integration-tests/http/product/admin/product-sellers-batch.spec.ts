import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"

import { createProductsWorkflow } from "@mercurjs/core/workflows"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60000)

/**
 * SPEC-015 — admin product↔seller eligibility batch endpoint
 * `POST /admin/products/:id/sellers`. Manages the `product_seller` restriction
 * allowlist from the product side via `linkSellersToProductWorkflow`, mirroring
 * the canonical `{ add, remove }` batch-link pattern.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - product sellers batch", () => {
      let appContainer: MedusaContainer

      beforeAll(() => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      const createProduct = async () => {
        const { result } = await createProductsWorkflow(appContainer).run({
          input: {
            products: [{ title: "Eligibility Product", status: "published" }],
            created_by: "admin_user",
          },
        })
        return (result as { id: string }[])[0].id
      }

      const createSeller = async (email: string) => {
        const { seller } = await createSellerUser(appContainer, {
          email,
          name: email,
        })
        return (seller as { id: string }).id
      }

      const linkedSellerIds = async (productId: string) => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const {
          data: [product],
        } = await query.graph({
          entity: "product",
          fields: ["id", "sellers.id"],
          filters: { id: productId },
        })
        return ((product?.sellers ?? []) as { id: string }[])
          .map((s) => s.id)
          .sort()
      }

      it("add: links a seller to the product (200)", async () => {
        const productId = await createProduct()
        const sellerId = await createSeller("add-seller@medusa.js")

        const res = await api.post(
          `/admin/products/${productId}/sellers`,
          { add: [sellerId] },
          adminHeaders
        )

        expect(res.status).toEqual(200)
        expect(res.data).toEqual({ id: productId, object: "product" })
        expect(await linkedSellerIds(productId)).toEqual([sellerId])
      })

      it("remove: unlinks a seller from the product (200)", async () => {
        const productId = await createProduct()
        const sellerId = await createSeller("remove-seller@medusa.js")

        await api.post(
          `/admin/products/${productId}/sellers`,
          { add: [sellerId] },
          adminHeaders
        )
        expect(await linkedSellerIds(productId)).toEqual([sellerId])

        const res = await api.post(
          `/admin/products/${productId}/sellers`,
          { remove: [sellerId] },
          adminHeaders
        )

        expect(res.status).toEqual(200)
        expect(await linkedSellerIds(productId)).toEqual([])
      })

      it("add + remove in one call applies both", async () => {
        const productId = await createProduct()
        const keepSeller = await createSeller("keep-seller@medusa.js")
        const dropSeller = await createSeller("drop-seller@medusa.js")
        const addSeller = await createSeller("new-seller@medusa.js")

        await api.post(
          `/admin/products/${productId}/sellers`,
          { add: [keepSeller, dropSeller] },
          adminHeaders
        )
        expect(await linkedSellerIds(productId)).toEqual(
          [keepSeller, dropSeller].sort()
        )

        const res = await api.post(
          `/admin/products/${productId}/sellers`,
          { add: [addSeller], remove: [dropSeller] },
          adminHeaders
        )

        expect(res.status).toEqual(200)
        expect(await linkedSellerIds(productId)).toEqual(
          [keepSeller, addSeller].sort()
        )
      })

      it("empty body is a 200 no-op", async () => {
        const productId = await createProduct()

        const res = await api.post(
          `/admin/products/${productId}/sellers`,
          {},
          adminHeaders
        )

        expect(res.status).toEqual(200)
        expect(await linkedSellerIds(productId)).toEqual([])
      })
    })
  },
})
