import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ProductChangeStatus } from "@mercurjs/types"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60_000)

/**
 * Publish-approval round trip for vendor-submitted products.
 *
 * Model: every product touch leaves an immediately-confirmed
 * `ProductChange` audit row carrying one `STATUS_CHANGE` action:
 *
 *   - vendor create   → audit change, `STATUS_CHANGE → proposed`
 *   - admin confirm   → audit change, `STATUS_CHANGE → published`
 *   - admin reject    → audit change, `STATUS_CHANGE → rejected`
 *   - admin request-changes → audit change, `STATUS_CHANGE → draft`
 *
 * Admin endpoints act on the product directly — no pending change
 * lookup, no approval queue.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, dbConnection, api }) => {
    describe("Admin publish approval against vendor-created products", () => {
      let container: MedusaContainer
      let sellerHeaders: { headers: Record<string, string> }

      beforeAll(async () => {
        container = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, container)
        const a = await createSellerUser(container, {
          email: "publish-seller@test.com",
          name: "Publish Seller",
        })
        sellerHeaders = a.headers
      })

      const createVendorProduct = async (title: string): Promise<string> => {
        const res = await api.post(
          `/vendor/products`,
          { title },
          sellerHeaders,
        )
        return res.data.product.id
      }

      const listChanges = async (productId: string) => {
        const query = container.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_change",
          fields: [
            "id",
            "status",
            "external_note",
            "internal_note",
            "actions.action",
            "actions.applied",
            "actions.details",
          ],
          filters: { product_id: productId },
        })
        return data as Array<{
          id: string
          status: string
          external_note: string | null
          internal_note: string | null
          actions: Array<{
            action: string
            applied: boolean
            details: Record<string, unknown>
          }>
        }>
      }

      it("records a confirmed audit change with STATUS_CHANGE → proposed on vendor create", async () => {
        const productId = await createVendorProduct("Pending Approval")

        // Product is left in `proposed` — no auto-publish.
        const got = await api.get(
          `/admin/products/${productId}`,
          adminHeaders,
        )
        expect(got.data.product.status).toBe("proposed")

        const changes = await listChanges(productId)
        expect(changes).toHaveLength(1)
        expect(changes[0].status).toBe(ProductChangeStatus.CONFIRMED)
        const statusAction = changes[0].actions.find(
          (a) => a.action === "STATUS_CHANGE",
        )
        expect(statusAction).toBeDefined()
        expect(statusAction!.details.status).toBe("proposed")
        expect(statusAction!.applied).toBe(true)
      })

      it("admin confirm publishes the product and stamps a STATUS_CHANGE → published audit change", async () => {
        const productId = await createVendorProduct("To Publish")

        const res = await api.post(
          `/admin/products/${productId}/confirm`,
          { internal_note: "looks good" },
          adminHeaders,
        )

        expect(res.status).toBe(200)
        expect(res.data.product.status).toBe("published")

        const changes = await listChanges(productId)
        const publishChange = changes.find((c) =>
          c.actions.some(
            (a) =>
              a.action === "STATUS_CHANGE" && a.details.status === "published",
          ),
        )
        expect(publishChange).toBeDefined()
        expect(publishChange!.status).toBe(ProductChangeStatus.CONFIRMED)
        expect(publishChange!.internal_note).toBe("looks good")
      })

      it("admin reject transitions the product to rejected and stamps a STATUS_CHANGE → rejected audit change with the message", async () => {
        const productId = await createVendorProduct("To Reject")

        const res = await api.post(
          `/admin/products/${productId}/reject`,
          { message: "Missing description" },
          adminHeaders,
        )

        expect(res.status).toBe(200)
        expect(res.data.product.status).toBe("rejected")

        const changes = await listChanges(productId)
        const rejectChange = changes.find((c) =>
          c.actions.some(
            (a) =>
              a.action === "STATUS_CHANGE" && a.details.status === "rejected",
          ),
        )
        expect(rejectChange).toBeDefined()
        expect(rejectChange!.status).toBe(ProductChangeStatus.CONFIRMED)
        expect(rejectChange!.external_note).toBe("Missing description")
      })

      it("admin request-changes leaves the product status untouched and stamps a CHANGE_REQUESTED audit change with the operator message", async () => {
        const productId = await createVendorProduct("Needs Revision")

        const res = await api.post(
          `/admin/products/${productId}/request-changes`,
          { message: "Please add photos" },
          adminHeaders,
        )

        expect(res.status).toBe(200)
        // Status stays put — the change-request only signals via audit
        // history + event, not a status transition.
        expect(res.data.product.status).toBe("proposed")

        const changes = await listChanges(productId)
        const requestChange = changes.find((c) =>
          c.actions.some((a) => a.action === "CHANGE_REQUESTED"),
        )
        expect(requestChange).toBeDefined()
        expect(requestChange!.status).toBe(ProductChangeStatus.CONFIRMED)
        expect(requestChange!.external_note).toBe("Please add photos")
        const action = requestChange!.actions.find(
          (a) => a.action === "CHANGE_REQUESTED",
        )!
        expect(action.applied).toBe(true)
        expect(action.details.message).toBe("Please add photos")
      })

      it("rejects admin confirm when the product is not `proposed`", async () => {
        const productId = await createVendorProduct("Already Published")
        await api.post(
          `/admin/products/${productId}/confirm`,
          {},
          adminHeaders,
        )

        const res = await api
          .post(`/admin/products/${productId}/confirm`, {}, adminHeaders)
          .catch((e) => e.response)

        expect(res.status).toBeGreaterThanOrEqual(400)
      })
    })
  },
})
