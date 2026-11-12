import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  MercurModules,
  ProductChangeActionType,
  ProductChangeStatus,
} from "@mercurjs/types"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60_000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, dbConnection, api }) => {
    describe("GET /admin/product-changes (requests)", () => {
      let container: MedusaContainer
      let sellerHeaders: { headers: Record<string, string> }
      let otherSellerHeaders: { headers: Record<string, string> }
      let sellerId: string
      let otherSellerId: string

      beforeAll(async () => {
        container = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, container)
        const a = await createSellerUser(container, {
          email: "requests-seller@test.com",
          name: "Requests Seller",
        })
        sellerHeaders = a.headers
        sellerId = sellerHeaders.headers["x-seller-id"]
        const b = await createSellerUser(container, {
          email: "requests-other@test.com",
          name: "Other Seller",
        })
        otherSellerHeaders = b.headers
        otherSellerId = otherSellerHeaders.headers["x-seller-id"]
      })

      const createVendorProduct = async (
        title: string,
        headers = sellerHeaders,
      ): Promise<string> => {
        const res = await api.post(`/vendor/products`, { title }, headers)
        expect(res.status).toBe(201)
        return res.data.product.id
      }

      const seedPendingChange = async (
        productId: string,
        createdBy: string,
        actions: Array<{
          action: ProductChangeActionType
          details?: Record<string, unknown>
        }>,
      ): Promise<string> => {
        const service: any = container.resolve(MercurModules.PRODUCT_EDIT)
        const [change] = await service.createProductChanges([
          {
            product_id: productId,
            created_by: createdBy,
            status: ProductChangeStatus.PENDING,
          },
        ])
        await service.createProductChangeActions(
          actions.map((a) => ({
            product_change_id: change.id,
            product_id: productId,
            action: a.action,
            details: a.details ?? {},
          })),
        )
        return change.id as string
      }

      const listRequests = async (query = "") => {
        const res = await api.get(`/admin/product-changes${query}`, adminHeaders)
        expect(res.status).toBe(200)
        return res.data as {
          product_changes: Array<{
            id: string
            product_id: string
            type: string
            action_count: number
            product_title: string
            product_status: string
            seller_id: string
            seller_name: string
          }>
          count: number
          offset: number
          limit: number
        }
      }

      it("lists a vendor-proposed product as a new_product row", async () => {
        const productId = await createVendorProduct("Awaiting Review")

        const { product_changes, count } = await listRequests()

        expect(count).toBe(1)
        expect(product_changes[0]).toEqual(
          expect.objectContaining({
            product_id: productId,
            type: "new_product",
            action_count: 1,
            product_title: "Awaiting Review",
            product_status: "proposed",
            seller_id: sellerId,
            seller_name: "Requests Seller",
          }),
        )
      })

      it("drops the row once the product is confirmed or rejected", async () => {
        const confirmedId = await createVendorProduct("Confirm Me")
        const rejectedId = await createVendorProduct("Reject Me")

        await api.post(
          `/admin/products/${confirmedId}/confirm`,
          {},
          adminHeaders,
        )
        await api.post(`/admin/products/${rejectedId}/reject`, {}, adminHeaders)

        const { product_changes } = await listRequests()
        expect(product_changes).toHaveLength(0)
      })

      it("drops the row while the operator waits on requested changes", async () => {
        const productId = await createVendorProduct("Needs Photos")

        await api.post(
          `/admin/products/${productId}/request-changes`,
          { message: "Please add photos" },
          adminHeaders,
        )

        const { product_changes } = await listRequests()
        expect(product_changes).toHaveLength(0)
      })

      it("lists pending vendor edits as update and delete rows", async () => {
        const productId = await createVendorProduct("Edited Product")
        await api.post(`/admin/products/${productId}/confirm`, {}, adminHeaders)

        const updateId = await seedPendingChange(productId, sellerId, [
          { action: ProductChangeActionType.UPDATE, details: { field: "title" } },
          {
            action: ProductChangeActionType.UPDATE,
            details: { field: "description" },
          },
        ])

        const deletedProductId = await createVendorProduct("Deleted Product")
        await api.post(
          `/admin/products/${deletedProductId}/confirm`,
          {},
          adminHeaders,
        )
        const deleteId = await seedPendingChange(deletedProductId, sellerId, [
          { action: ProductChangeActionType.PRODUCT_DELETE },
        ])

        const { product_changes } = await listRequests("?order=created_at")
        expect(product_changes.map((c) => [c.id, c.type, c.action_count])).toEqual([
          [updateId, "update", 2],
          [deleteId, "delete", 1],
        ])

        await api.post(
          `/admin/product-changes/${updateId}/confirm`,
          {},
          adminHeaders,
        )

        const after = await listRequests()
        expect(after.product_changes.map((c) => c.id)).toEqual([deleteId])
      })

      it("brings the row back once the store resubmits after requested changes", async () => {
        const productId = await createVendorProduct("Resubmitted")
        await api.post(
          `/admin/products/${productId}/request-changes`,
          { message: "Add a description" },
          adminHeaders,
        )
        expect((await listRequests()).count).toBe(0)

        const res = await api.post(
          `/vendor/products/${productId}`,
          { description: "A proper description" },
          sellerHeaders,
        )
        expect(res.status).toBe(202)

        const { product_changes } = await listRequests()
        expect(product_changes.map((c) => [c.product_id, c.type])).toEqual([
          [productId, "new_product"],
        ])
      })

      it("ignores products created by operators", async () => {
        const res = await api.post(
          `/admin/products`,
          { title: "Operator Product", status: "proposed" },
          adminHeaders,
        )
        expect(res.status).toBe(200)

        const { count } = await listRequests()
        expect(count).toBe(0)
      })

      it("filters by type, seller and search", async () => {
        const proposedId = await createVendorProduct("Alpha Widget")
        const otherProposedId = await createVendorProduct(
          "Beta Gadget",
          otherSellerHeaders,
        )
        const publishedId = await createVendorProduct("Gamma Tool")
        await api.post(
          `/admin/products/${publishedId}/confirm`,
          {},
          adminHeaders,
        )
        const updateId = await seedPendingChange(publishedId, sellerId, [
          { action: ProductChangeActionType.UPDATE, details: { field: "title" } },
        ])

        const byType = await listRequests("?type=update")
        expect(byType.product_changes.map((c) => c.id)).toEqual([updateId])

        const bySeller = await listRequests(`?seller_id=${otherSellerId}`)
        expect(bySeller.product_changes.map((c) => c.product_id)).toEqual([
          otherProposedId,
        ])

        const bySearch = await listRequests("?q=alpha")
        expect(bySearch.product_changes.map((c) => c.product_id)).toEqual([
          proposedId,
        ])

        const byStore = await listRequests("?q=Other%20Seller")
        expect(byStore.product_changes.map((c) => c.product_id)).toEqual([
          otherProposedId,
        ])
      })

      it("sorts and paginates", async () => {
        await createVendorProduct("Charlie")
        await createVendorProduct("Alpha")
        await createVendorProduct("Bravo")

        const asc = await listRequests("?order=product_title")
        expect(asc.product_changes.map((c) => c.product_title)).toEqual([
          "Alpha",
          "Bravo",
          "Charlie",
        ])

        const desc = await listRequests("?order=-product_title&limit=2")
        expect(desc.count).toBe(3)
        expect(desc.limit).toBe(2)
        expect(desc.product_changes.map((c) => c.product_title)).toEqual([
          "Charlie",
          "Bravo",
        ])

        const page2 = await listRequests("?order=-product_title&limit=2&offset=2")
        expect(page2.offset).toBe(2)
        expect(page2.product_changes.map((c) => c.product_title)).toEqual([
          "Alpha",
        ])
      })
    })
  },
})
