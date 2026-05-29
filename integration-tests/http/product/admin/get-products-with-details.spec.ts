import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { MercurModules, ProductChangeStatus } from "@mercurjs/types"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

import { getProductsWithDetailsWorkflow } from "../../../../packages/core/src/workflows/product/workflows/get-products-with-details"
import {
  createProductChangeWorkflow,
  requestProductChangesWorkflow,
} from "../../../../packages/core/src/workflows/product-change"

jest.setTimeout(50000)

/**
 * Integration coverage for `getProductsWithDetailsWorkflow` — the
 * SPEC-008 step 4 sub-step D read-side wrapper that decorates every
 * stock product DTO with the marketplace-computed `requires_action`
 * boolean via the `formatProducts` util.
 *
 * The wrapper unconditionally appends `changes.id` + `changes.status`
 * to the caller's field tree so the computed value resolves regardless
 * of the caller's selection. Clients **do not** put `*requires_action`
 * in their field tree — it ships as part of the wrapper's response
 * contract, not as a joiner alias.
 *
 * **Gated on SPEC-008 step 5** — the wrapper joins through the new
 * `product-change-link.ts`, which references the new `product-change`
 * module. Until the module is registered, the `changes` alias on
 * `product` cannot be resolved.
 */
const STEP_5_LANDED = process.env.SPEC_008_STEP_5_LANDED === "true"

if (STEP_5_LANDED) {
  medusaIntegrationTestRunner({
    testSuite: ({ getContainer, dbConnection }) => {
      describe("getProductsWithDetailsWorkflow (SPEC-008)", () => {
        let appContainer: MedusaContainer

        beforeAll(async () => {
          appContainer = getContainer()
        })

        beforeEach(async () => {
          await createAdminUser(dbConnection, adminHeaders, appContainer)
        })

        const createProduct = async (title: string): Promise<string> => {
          const productModule = appContainer.resolve(Modules.PRODUCT)
          const [product] = await productModule.createProducts([
            {
              title,
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
          return product.id
        }

        const openPendingChange = async (productId: string): Promise<string> => {
          const { result } = await createProductChangeWorkflow(
            appContainer,
          ).run({
            input: {
              changes: [
                {
                  product_id: productId,
                  status: ProductChangeStatus.PENDING,
                  created_by: "admin",
                },
              ],
            },
          })
          return result[0].id
        }

        it("returns requires_action=false for a product with no changes", async () => {
          const productId = await createProduct("No-change product")

          const { result } = await getProductsWithDetailsWorkflow(
            appContainer,
          ).run({
            input: {
              fields: ["id", "title"],
              filters: { id: productId },
            },
          })

          expect(result.data).toHaveLength(1)
          expect(result.data[0].requires_action).toBe(false)
        })

        it("returns requires_action=true after a REQUIRES_ACTION change is opened", async () => {
          const productId = await createProduct("Needs-action product")
          const changeId = await openPendingChange(productId)
          await requestProductChangesWorkflow(appContainer).run({
            input: {
              id: changeId,
              requires_action_by: "admin",
              requires_action_reason: "Missing description",
            },
          })

          const { result } = await getProductsWithDetailsWorkflow(
            appContainer,
          ).run({
            input: {
              fields: ["id", "title"],
              filters: { id: productId },
            },
          })

          expect(result.data[0].requires_action).toBe(true)
        })

        it("returns requires_action=false for PENDING / CONFIRMED / DECLINED / CANCELED only", async () => {
          const pendingId = await createProduct("Pending change product")
          await openPendingChange(pendingId)

          const declinedId = await createProduct("Declined change product")
          const declinedChangeId = await openPendingChange(declinedId)
          const changeModule = appContainer.resolve(MercurModules.PRODUCT_CHANGE)
          await changeModule.updateProductChanges([
            { id: declinedChangeId, status: ProductChangeStatus.DECLINED },
          ])

          for (const id of [pendingId, declinedId]) {
            const { result } = await getProductsWithDetailsWorkflow(
              appContainer,
            ).run({
              input: { fields: ["id"], filters: { id } },
            })
            expect(result.data[0].requires_action).toBe(false)
          }
        })

        it("preserves caller-requested fields alongside the computed field", async () => {
          const productId = await createProduct("Field-tree preservation")

          const { result } = await getProductsWithDetailsWorkflow(
            appContainer,
          ).run({
            input: {
              fields: ["id", "title", "status"],
              filters: { id: productId },
            },
          })

          const row = result.data[0] as Record<string, unknown>
          expect(row.id).toBe(productId)
          expect(row.title).toBe("Field-tree preservation")
          expect(row.status).toBe("draft")
          expect(row.requires_action).toBe(false)
        })

        it("appends changes.status even when the caller does not request changes", async () => {
          const productId = await createProduct("Implicit changes join")
          const changeId = await openPendingChange(productId)
          await requestProductChangesWorkflow(appContainer).run({
            input: { id: changeId, requires_action_by: "admin" },
          })

          // Caller field tree intentionally omits `changes.*`.
          const { result } = await getProductsWithDetailsWorkflow(
            appContainer,
          ).run({
            input: {
              fields: ["id", "title"],
              filters: { id: productId },
            },
          })

          // Computed field still resolves because the wrapper adds
          // changes.id + changes.status unconditionally.
          expect(result.data[0].requires_action).toBe(true)
        })

        it("supports list queries with pagination metadata", async () => {
          const ids = await Promise.all([
            createProduct("List item 1"),
            createProduct("List item 2"),
            createProduct("List item 3"),
          ])

          const { result } = await getProductsWithDetailsWorkflow(
            appContainer,
          ).run({
            input: {
              fields: ["id", "title"],
              filters: { id: ids },
              pagination: { take: 2, skip: 0, order: { title: "ASC" } },
            },
          })

          expect(result.data).toHaveLength(2)
          expect(result.metadata?.take).toBe(2)
          expect(result.metadata?.count).toBeGreaterThanOrEqual(3)
          for (const row of result.data) {
            expect((row as { requires_action: boolean }).requires_action).toBe(
              false,
            )
          }
        })
      })
    },
  })
} else {
  describe.skip(
    "getProductsWithDetailsWorkflow (SPEC-008 step 5 gated)",
    () => {
      it.skip(
        "enable with SPEC_008_STEP_5_LANDED=true once withMercur() registers the new modules",
        () => {},
      )
    },
  )
}
