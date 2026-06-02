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

jest.setTimeout(60_000)

/**
 * Admin product-change approval flow — covers the three operator
 * endpoints documented in `product-edit.md`:
 *
 *   - POST /admin/products/:id/confirm         → applies staged actions
 *   - POST /admin/products/:id/reject          → marks change DECLINED
 *   - POST /admin/products/:id/request-changes → marks REQUIRES_ACTION
 *
 * Each test seeds a PENDING `ProductChange` directly so the suite is
 * insensitive to the `PRODUCT_REQUEST` feature flag value the test
 * env carries.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, dbConnection, api }) => {
    describe("Admin /admin/products/:id approval endpoints (SPEC-008)", () => {
      let container: MedusaContainer

      beforeAll(async () => {
        container = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, container)
      })

      const createTestProduct = async (overrides?: {
        title?: string
      }): Promise<string> => {
        const productModule: any = container.resolve(Modules.PRODUCT)
        const [product] = await productModule.createProducts([
          {
            title: overrides?.title ?? "Approval Product",
            status: "draft",
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

      const seedPendingChange = async (
        productId: string,
        actions: Array<{ action: ProductChangeActionType; details: Record<string, unknown> }>,
      ): Promise<string> => {
        const service: any = container.resolve(MercurModules.PRODUCT_CHANGE)
        const [change] = await service.createProductChanges([
          {
            product_id: productId,
            created_by: "vendor-seed",
            status: ProductChangeStatus.PENDING,
          },
        ])
        await service.createProductChangeActions(
          actions.map((a) => ({
            product_change_id: change.id,
            product_id: productId,
            action: a.action,
            details: a.details,
          })),
        )
        return change.id as string
      }

      const getChange = async (id: string) => {
        const query = container.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_change",
          fields: ["id", "status", "declined_reason", "requires_action_reason"],
          filters: { id },
        })
        return data[0] as { id: string; status: string; declined_reason?: string; requires_action_reason?: string } | undefined
      }

      describe("POST /admin/products/:id/confirm", () => {
        it("applies staged UPDATE actions to the product and marks the change CONFIRMED", async () => {
          const productId = await createTestProduct({ title: "Before Confirm" })
          const changeId = await seedPendingChange(productId, [
            {
              action: ProductChangeActionType.UPDATE,
              details: { field: "title", value: "After Confirm" },
            },
          ])

          const res = await api.post(
            `/admin/products/${productId}/confirm`,
            {},
            adminHeaders,
          )

          expect(res.status).toBe(200)
          expect(res.data.product.title).toBe("After Confirm")

          const change = await getChange(changeId)
          expect(change?.status).toBe(ProductChangeStatus.CONFIRMED)
        })

        it("returns 404 when no pending change exists", async () => {
          const productId = await createTestProduct()

          const res = await api
            .post(`/admin/products/${productId}/confirm`, {}, adminHeaders)
            .catch((e) => e.response)

          expect(res.status).toBe(404)
        })
      })

      describe("POST /admin/products/:id/reject", () => {
        it("marks the pending change DECLINED without mutating the product", async () => {
          const productId = await createTestProduct({ title: "Stay Same" })
          const changeId = await seedPendingChange(productId, [
            {
              action: ProductChangeActionType.UPDATE,
              details: { field: "title", value: "Rejected Title" },
            },
          ])

          const res = await api.post(
            `/admin/products/${productId}/reject`,
            { message: "Not allowed" },
            adminHeaders,
          )

          expect(res.status).toBe(200)
          expect(res.data.product.title).toBe("Stay Same")

          const change = await getChange(changeId)
          expect(change?.status).toBe(ProductChangeStatus.DECLINED)
          expect(change?.declined_reason).toBe("Not allowed")
        })
      })

      describe("POST /admin/products/:id/request-changes", () => {
        it("marks the change REQUIRES_ACTION and records the message", async () => {
          const productId = await createTestProduct()
          const changeId = await seedPendingChange(productId, [
            {
              action: ProductChangeActionType.UPDATE,
              details: { field: "title", value: "Needs Work" },
            },
          ])

          const res = await api.post(
            `/admin/products/${productId}/request-changes`,
            { message: "Please clarify" },
            adminHeaders,
          )

          expect(res.status).toBe(200)

          const change = await getChange(changeId)
          expect(change?.status).toBe(ProductChangeStatus.REQUIRES_ACTION)
          expect(change?.requires_action_reason).toBe("Please clarify")
        })
      })
    })
  },
})
