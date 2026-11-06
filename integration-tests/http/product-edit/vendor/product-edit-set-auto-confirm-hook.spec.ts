import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { stageProductChangeWorkflow } from "@mercurjs/core/workflows"
import { ProductChangeStatus } from "@mercurjs/types"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60_000)

// A workflow hook accepts a single handler, so it is registered once and the
// tests choose its answer through this variable.
let decision: { auto_confirm?: boolean } | undefined
let received: {
  product?: { id: string; status: string }
  product_change?: { id: string }
  actions?: unknown[]
} | null = null

stageProductChangeWorkflow.hooks.setAutoConfirm((input) => {
  received = input as typeof received
  return new StepResponse(decision)
})

medusaIntegrationTestRunner({
  env: { MEDUSA_FF_PRODUCT_REQUEST: "true" },
  testSuite: ({ getContainer, dbConnection, api }) => {
    describe("stageProductChangeWorkflow - setAutoConfirm hook", () => {
      let container: MedusaContainer
      let sellerHeaders: { headers: Record<string, string> }

      beforeAll(async () => {
        container = getContainer()
      })

      beforeEach(async () => {
        decision = undefined
        received = null
        await createAdminUser(dbConnection, adminHeaders, container)
        const seller = await createSellerUser(container, {
          email: "auto-confirm-hook@test.com",
          name: "Auto Confirm Hook Seller",
        })
        sellerHeaders = seller.headers
      })

      const createVendorProduct = async (title: string): Promise<string> => {
        const res = await api.post(`/vendor/products`, { title }, sellerHeaders)
        expect(res.status).toBe(201)
        return res.data.product.id
      }

      const edit = (productId: string, title: string) =>
        api.post(`/vendor/products/${productId}`, { title }, sellerHeaders)

      it("keeps a proposed product's edit pending when the hook says so", async () => {
        const productId = await createVendorProduct("Held Product")
        decision = { auto_confirm: false }

        const res = await edit(productId, "Held Product, edited")

        expect(res.status).toBe(202)
        expect(res.data.product_change).toEqual(
          expect.objectContaining({
            product_id: productId,
            status: ProductChangeStatus.PENDING,
          })
        )
        expect(received).toEqual({
          product: expect.objectContaining({ id: productId, status: "proposed" }),
          product_change: expect.objectContaining({ id: res.data.product_change.id }),
          actions: expect.arrayContaining([
            expect.objectContaining({ product_change_id: res.data.product_change.id }),
          ]),
          created_by: expect.any(String),
        })

        const product = await api.get(`/vendor/products/${productId}`, sellerHeaders)
        expect(product.data.product.title).toBe("Held Product")
      })

      it("confirms a published product's edit when the hook says so", async () => {
        const productId = await createVendorProduct("Trusted Product")
        await api.post(`/admin/products/${productId}/confirm`, {}, adminHeaders)
        decision = { auto_confirm: true }

        const res = await edit(productId, "Trusted Product, edited")

        expect(res.status).toBe(202)
        expect(res.data.product_change.status).toBe(ProductChangeStatus.CONFIRMED)

        const product = await api.get(`/vendor/products/${productId}`, sellerHeaders)
        expect(product.data.product.title).toBe("Trusted Product, edited")
      })

      it("falls back to the product status when the hook returns nothing", async () => {
        const productId = await createVendorProduct("Default Product")

        const res = await edit(productId, "Default Product, edited")

        expect(res.status).toBe(202)
        expect(res.data.product_change.status).toBe(ProductChangeStatus.CONFIRMED)
      })
    })
  },
})
