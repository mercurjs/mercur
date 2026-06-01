import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { MercurModules, ProductChangeStatus } from "@mercurjs/types"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

import {
  applyProductChangeActionsWorkflow,
  cancelProductChangeWorkflow,
  confirmProductChangeWorkflow,
  createProductChangeWorkflow,
  rejectProductChangeWorkflow,
  requestProductChangesWorkflow,
  resubmitProductChangeWorkflow,
} from "@mercurjs/core/workflows"

jest.setTimeout(50000)

/**
 * Integration coverage for the SPEC-008 product-change workflow group.
 *
 * Workflows under test:
 *
 * - `createProductChangeWorkflow` — enforces one-pending-change per
 *   product (`validateNoPendingProductChangeStep`) and writes the
 *   `product_change_link` pivot via `createRemoteLinkStep`.
 * - `confirmProductChangeWorkflow` — transitions PENDING → CONFIRMED
 *   AND invokes `applyProductChangeActionsWorkflow` to dispatch
 *   pending actions into stock product workflows / Module-Link writes.
 * - `requestProductChangesWorkflow` — PENDING → REQUIRES_ACTION.
 * - `resubmitProductChangeWorkflow` — REQUIRES_ACTION → PENDING.
 * - `cancelProductChangeWorkflow` — PENDING → CANCELED.
 * - `rejectProductChangeWorkflow` — PENDING → DECLINED.
 * - `applyProductChangeActionsWorkflow` — bucketing + cross-module
 *   dispatch over `ProductChangeActionType.*` (covered in detail by
 *   `apply-product-change-actions.spec.ts`).
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, dbConnection }) => {
    describe("Admin - Product change lifecycle (SPEC-008)", () => {
      let appContainer: MedusaContainer

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      const createTestProduct = async (): Promise<string> => {
        const productModule = appContainer.resolve(Modules.PRODUCT)
        const [product] = await productModule.createProducts([
          {
            title: "Test Product",
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

      const listChanges = async (productId: string) => {
        const query = appContainer.resolve("query")
        const { data } = await query.graph({
          entity: "product_change",
          fields: ["id", "status", "product.id"],
          filters: {},
        })
        return (
          data as Array<{
            id: string
            status: string
            product?: { id?: string } | Array<{ id?: string }> | null
          }>
        )
          .filter((c) => {
            const products = Array.isArray(c.product)
              ? c.product
              : c.product
                ? [c.product]
                : []
            return products.some((p) => p.id === productId)
          })
          .map((c) => ({ id: c.id, status: c.status }))
      }

      it("creates a pending change linked to the product", async () => {
        const productId = await createTestProduct()

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

        expect(result).toHaveLength(1)
        expect(result[0].status).toBe(ProductChangeStatus.PENDING)

        const linked = await listChanges(productId)
        expect(linked).toHaveLength(1)
        expect(linked[0].id).toBe(result[0].id)
      })

      it("rejects a second pending change on the same product", async () => {
        const productId = await createTestProduct()

        await createProductChangeWorkflow(appContainer).run({
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

        await expect(
          createProductChangeWorkflow(appContainer).run({
            input: {
              changes: [
                {
                  product_id: productId,
                  status: ProductChangeStatus.PENDING,
                  created_by: "admin",
                },
              ],
            },
          }),
        ).rejects.toThrow(/pending/i)
      })

      it("confirms a pending change and runs apply", async () => {
        const productId = await createTestProduct()

        const { result: changes } = await createProductChangeWorkflow(
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

        await confirmProductChangeWorkflow(appContainer).run({
          input: {
            ids: [changes[0].id],
            confirmed_by: "admin",
          },
        })

        const linked = await listChanges(productId)
        expect(linked[0].status).toBe(ProductChangeStatus.CONFIRMED)
      })

      it("transitions PENDING → REQUIRES_ACTION via requestProductChangesWorkflow", async () => {
        const productId = await createTestProduct()

        const { result: changes } = await createProductChangeWorkflow(
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

        await requestProductChangesWorkflow(appContainer).run({
          input: {
            id: changes[0].id,
            requires_action_by: "admin",
            requires_action_reason: "Missing description",
          },
        })

        const linked = await listChanges(productId)
        expect(linked[0].status).toBe(ProductChangeStatus.REQUIRES_ACTION)
      })

      it("transitions REQUIRES_ACTION → PENDING via resubmit", async () => {
        const productId = await createTestProduct()

        const { result: changes } = await createProductChangeWorkflow(
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

        await requestProductChangesWorkflow(appContainer).run({
          input: { id: changes[0].id, requires_action_by: "admin" },
        })

        await resubmitProductChangeWorkflow(appContainer).run({
          input: { id: changes[0].id },
        })

        const linked = await listChanges(productId)
        expect(linked[0].status).toBe(ProductChangeStatus.PENDING)
      })

      it("transitions PENDING → CANCELED", async () => {
        const productId = await createTestProduct()

        const { result: changes } = await createProductChangeWorkflow(
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

        await cancelProductChangeWorkflow(appContainer).run({
          input: { id: changes[0].id, canceled_by: "admin" },
        })

        const linked = await listChanges(productId)
        expect(linked[0].status).toBe(ProductChangeStatus.CANCELED)
      })

      it("transitions PENDING → DECLINED via reject", async () => {
        const productId = await createTestProduct()

        const { result: changes } = await createProductChangeWorkflow(
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

        await rejectProductChangeWorkflow(appContainer).run({
          input: {
            id: changes[0].id,
            declined_by: "admin",
            declined_reason: "Out of policy",
          },
        })

        const linked = await listChanges(productId)
        expect(linked[0].status).toBe(ProductChangeStatus.DECLINED)
      })

      it("applyProductChangeActionsWorkflow is invoked from confirm and marks actions applied", async () => {
        const productId = await createTestProduct()

        // Stage a STATUS_CHANGE action on a pending change.
        const { result: changes } = await createProductChangeWorkflow(
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

        const changeModule = appContainer.resolve(MercurModules.PRODUCT_CHANGE)
        await changeModule.createProductChangeActions([
          {
            product_change_id: changes[0].id,
            product_id: productId,
            action: "STATUS_CHANGE",
            details: { status: "published" },
          },
        ])

        // Confirm — under the hood runs applyProductChangeActionsWorkflow.
        await confirmProductChangeWorkflow(appContainer).run({
          input: { ids: [changes[0].id], confirmed_by: "admin" },
        })

        const productModule = appContainer.resolve(Modules.PRODUCT)
        const product = await productModule.retrieveProduct(productId)
        expect(product.status).toBe("published")

        const actions = await changeModule.listProductChangeActions({
          product_change_id: changes[0].id,
        })
        expect(actions.every((a: { applied: boolean }) => a.applied)).toBe(
          true,
        )
      })

      it("applyProductChangeActionsWorkflow runs standalone over a change id list", async () => {
        const productId = await createTestProduct()
        const { result: changes } = await createProductChangeWorkflow(
          appContainer,
        ).run({
          input: {
            changes: [
              {
                product_id: productId,
                status: ProductChangeStatus.CONFIRMED,
                created_by: "admin",
              },
            ],
          },
        })

        const changeModule = appContainer.resolve(MercurModules.PRODUCT_CHANGE)
        await changeModule.createProductChangeActions([
          {
            product_change_id: changes[0].id,
            product_id: productId,
            action: "UPDATE",
            details: { field: "title", value: "Renamed via apply" },
          },
        ])

        await applyProductChangeActionsWorkflow(appContainer).run({
          input: { change_ids: [changes[0].id] },
        })

        const productModule = appContainer.resolve(Modules.PRODUCT)
        const product = await productModule.retrieveProduct(productId)
        expect(product.title).toBe("Renamed via apply")
      })
    })
  },
})
