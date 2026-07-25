import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateStoresWorkflow } from "@medusajs/medusa/core-flows"
import { ProductChangeStatus } from "@mercurjs/types"

import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60_000)

// The test env runs with MEDUSA_FF_PRODUCT_REQUEST=false, so these suites set
// the store setting directly to prove it overrides the flag either way.
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Vendor product approval setting (SPEC-025)", () => {
      let container: MedusaContainer
      let sellerHeaders: { headers: Record<string, string> }
      let storeId: string

      beforeAll(() => {
        container = getContainer()
      })

      beforeEach(async () => {
        const a = await createSellerUser(container, {
          email: "approval-seller@test.com",
          name: "Approval Seller",
        })
        sellerHeaders = a.headers

        const query = container.resolve(ContainerRegistrationKeys.QUERY)
        const {
          data: [store],
        } = await query.graph({ entity: "store", fields: ["id"] })
        storeId = store.id
      })

      const setStoreMetadata = async (
        metadata: Record<string, unknown>
      ) => {
        await updateStoresWorkflow(container).run({
          input: { selector: { id: storeId }, update: { metadata } },
        })
      }

      const setRequireApproval = (value: boolean) =>
        setStoreMetadata({ require_product_approval: value })

      const setAllowCreation = (value: boolean) =>
        setStoreMetadata({ allow_vendor_product_creation: value })

      const createVendorProduct = async (title: string): Promise<string> => {
        const res = await api.post(`/vendor/products`, { title }, sellerHeaders)
        return res.data.product.id
      }

      describe("POST /vendor/products creation gate (Site C)", () => {
        it("rejects creation when vendor product creation is disabled", async () => {
          await setAllowCreation(false)

          const res = await api
            .post(
              `/vendor/products`,
              { title: "Blocked Product" },
              sellerHeaders,
            )
            .catch((e) => e.response)

          expect(res.status).toBe(403)
          expect(res.data.message).toContain(
            "Vendor product creation is disabled",
          )
        })

        it("allows creation when vendor product creation is enabled", async () => {
          await setAllowCreation(true)

          const res = await api.post(
            `/vendor/products`,
            { title: "Allowed Product" },
            sellerHeaders,
          )

          expect(res.status).toBe(201)
          expect(res.data.product.id).toBeTruthy()
        })
      })

      describe("POST /vendor/products status restriction (Site B)", () => {
        it("rejects a published status when approval is required", async () => {
          await setRequireApproval(true)

          const res = await api
            .post(
              `/vendor/products`,
              { title: "Gated Product", status: "published" },
              sellerHeaders,
            )
            .catch((e) => e.response)

          expect(res.status).toBeGreaterThanOrEqual(400)
          expect(res.data.message).toContain("admin approval is required")
        })

        it("allows a published status when approval is disabled", async () => {
          await setRequireApproval(false)

          const res = await api.post(
            `/vendor/products`,
            { title: "Auto Approved Product", status: "published" },
            sellerHeaders,
          )

          expect(res.status).toBe(201)
          expect(res.data.product.status).toBe("published")
        })

        it("keeps the default proposed status when no status is sent and approval is required", async () => {
          await setRequireApproval(true)

          const res = await api.post(
            `/vendor/products`,
            { title: "Default Status Gated Product" },
            sellerHeaders,
          )

          expect(res.status).toBe(201)
          expect(res.data.product.status).toBe("proposed")
        })

        it("auto-publishes the default proposed status via the productsCreated hook when approval is disabled", async () => {
          await setRequireApproval(false)

          const res = await api.post(
            `/vendor/products`,
            { title: "Default Status Auto Approved Product" },
            sellerHeaders,
          )

          expect(res.status).toBe(201)
          expect(res.data.product.status).toBe("published")
        })
      })

      describe("Product edit auto-confirm gate (Site A)", () => {
        it("keeps the edit change pending when approval is required", async () => {
          await setRequireApproval(true)
          const productId = await createVendorProduct("Edit Gated")

          const res = await api.post(
            `/vendor/products/${productId}`,
            { title: "Edited Gated" },
            sellerHeaders,
          )

          expect(res.status).toBe(202)
          expect(res.data.product_change.status).toBe(
            ProductChangeStatus.PENDING,
          )
        })

        it("auto-confirms the edit change when approval is disabled", async () => {
          await setRequireApproval(false)
          const productId = await createVendorProduct("Edit Open")

          const res = await api.post(
            `/vendor/products/${productId}`,
            { title: "Edited Open" },
            sellerHeaders,
          )

          expect(res.status).toBe(202)
          expect(res.data.product_change.status).toBe(
            ProductChangeStatus.CONFIRMED,
          )
        })
      })
    })
  },
})
