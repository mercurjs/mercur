import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
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

/**
 * Publish-approval round trip. The vendor create flow opens a pending
 * `ProductChange` with a `STATUS_CHANGE → PUBLISHED` action so the
 * admin's confirm / reject / request-changes endpoints have something
 * to act on. The test env runs with `MEDUSA_FF_PRODUCT_REQUEST=false`,
 * so `autoConfirmProductChangeWorkflow` applies that change inline —
 * the first test asserts the auto-confirm path. The remaining tests
 * seed a fresh PENDING change directly to cover the operator
 * approval endpoints (the path the flag-on production env takes).
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

      const listChanges = async (productId: string) => {
        const query = container.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_change",
          fields: ["id", "status", "actions.action", "actions.details"],
          filters: { product_id: productId },
        })
        return data as Array<{
          id: string
          status: string
          actions: Array<{ action: string; details: Record<string, unknown> }>
        }>
      }

      const createProposedProductDirect = async (
        title: string,
      ): Promise<string> => {
        // Bypass the vendor create flow so we end up with a `PROPOSED`
        // product *without* the auto-confirmed publish change that the
        // route would normally open. Lets the admin endpoint tests
        // exercise the pending-change path explicitly.
        const productModule: any = container.resolve(Modules.PRODUCT)
        const [product] = await productModule.createProducts([
          {
            title,
            status: "proposed",
            options: [{ title: "Default", values: ["one"] }],
            variants: [
              {
                title: "Default Variant",
                manage_inventory: false,
                options: { Default: "one" },
              },
            ],
          },
        ])
        return product.id as string
      }

      const seedPublishChange = async (productId: string): Promise<string> => {
        const service: any = container.resolve(MercurModules.PRODUCT_CHANGE)
        const [change] = await service.createProductChanges([
          {
            product_id: productId,
            created_by: "vendor-seed",
            status: ProductChangeStatus.PENDING,
          },
        ])
        await service.createProductChangeActions([
          {
            product_change_id: change.id,
            product_id: productId,
            action: ProductChangeActionType.STATUS_CHANGE,
            details: {
              status: "published",
              previous_status: "proposed",
            },
          },
        ])
        return change.id as string
      }

      it("opens a publish ProductChange on vendor create and auto-confirms it when the flag is off", async () => {
        const res = await api.post(
          `/vendor/products`,
          { title: "Auto-Published" },
          sellerHeaders,
        )
        const productId = res.data.product.id

        const changes = await listChanges(productId)
        const publishChange = changes.find((c) =>
          c.actions.some((a) => a.action === "STATUS_CHANGE"),
        )
        expect(publishChange).toBeDefined()
        // Test env disables `PRODUCT_REQUEST`, so the publish change
        // auto-confirms inline and the product reaches `published`.
        expect(publishChange!.status).toBe(ProductChangeStatus.CONFIRMED)

        const got = await api.get(
          `/admin/products/${productId}`,
          adminHeaders,
        )
        expect(got.data.product.status).toBe("published")
      })

      it("admin confirm applies the publish change and publishes the product", async () => {
        const productId = await createProposedProductDirect("To Publish")
        await seedPublishChange(productId)

        const res = await api.post(
          `/admin/products/${productId}/confirm`,
          {},
          adminHeaders,
        )

        expect(res.status).toBe(200)
        expect(res.data.product.status).toBe("published")
      })

      it("admin reject leaves the product unpublished and marks the change DECLINED", async () => {
        const productId = await createProposedProductDirect("To Reject")
        const changeId = await seedPublishChange(productId)

        const res = await api.post(
          `/admin/products/${productId}/reject`,
          { message: "Missing description" },
          adminHeaders,
        )

        expect(res.status).toBe(200)
        // Without an explicit STATUS_CHANGE → rejected compensation,
        // the product stays in `proposed` — the vendor reads the
        // declined ProductChange as the rejection signal.
        expect(res.data.product.status).toBe("proposed")

        const changes = await listChanges(productId)
        const declined = changes.find((c) => c.id === changeId)
        expect(declined?.status).toBe(ProductChangeStatus.DECLINED)
      })

      it("admin request-changes marks the change REQUIRES_ACTION", async () => {
        const productId = await createProposedProductDirect("Needs Revision")
        const changeId = await seedPublishChange(productId)

        const res = await api.post(
          `/admin/products/${productId}/request-changes`,
          { message: "Please add photos" },
          adminHeaders,
        )

        expect(res.status).toBe(200)

        const changes = await listChanges(productId)
        const requiresAction = changes.find((c) => c.id === changeId)
        expect(requiresAction?.status).toBe(ProductChangeStatus.REQUIRES_ACTION)
      })
    })
  },
})
