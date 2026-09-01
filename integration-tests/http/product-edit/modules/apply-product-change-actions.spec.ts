import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  MercurModules,
  ProductChangeActionType,
  ProductChangeStatus,
} from "@mercurjs/types"

import { applyProductChangeActionsWorkflow } from "@mercurjs/core/workflows"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60_000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, dbConnection, api }) => {
    describe("applyProductChangeActionsWorkflow", () => {
      let container: MedusaContainer
      let sellerHeaders: { headers: Record<string, string> }

      beforeAll(async () => {
        container = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, container)
        const seller = await createSellerUser(container, {
          email: "apply-actions-seller@test.com",
          name: "Apply Actions Seller",
        })
        sellerHeaders = seller.headers
      })

      type ProductChangeRow = { id: string }
      type ProductEditService = {
        createProductChanges(
          data: Array<Record<string, unknown>>,
        ): Promise<ProductChangeRow[]>
        createProductChangeActions(
          data: Array<Record<string, unknown>>,
        ): Promise<ProductChangeRow[]>
      }

      const service = () =>
        container.resolve<ProductEditService>(MercurModules.PRODUCT_EDIT)

      const stageChange = async (
        productId: string,
        actions: Array<Record<string, unknown>>,
      ) => {
        const [change] = await service().createProductChanges([
          { product_id: productId, status: ProductChangeStatus.PENDING },
        ])
        const created = await service().createProductChangeActions(
          actions.map((action) => ({
            product_id: productId,
            product_change_id: change.id,
            applied: false,
            ...action,
          })),
        )
        return { change, actions: created }
      }

      const readActions = async (changeId: string) => {
        const query = container.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_change_action",
          fields: ["id", "action", "applied", "reference", "reference_id"],
          filters: { product_change_id: changeId },
        })
        return data as Array<{
          id: string
          action: string
          applied: boolean
          reference: string | null
          reference_id: string | null
        }>
      }

      const createProduct = async (title: string): Promise<string> => {
        const res = await api.post("/vendor/products", { title }, sellerHeaders)
        return res.data.product.id
      }

      it("applies and stamps a handled action", async () => {
        const productId = await createProduct("Handled Only")
        const { change } = await stageChange(productId, [
          {
            action: ProductChangeActionType.UPDATE,
            details: { field: "subtitle", value: "applied subtitle" },
          },
        ])

        await applyProductChangeActionsWorkflow(container).run({
          input: { change_ids: [change.id] },
        })

        const actions = await readActions(change.id)
        expect(actions).toHaveLength(1)
        expect(actions[0].applied).toBe(true)

        const product = await api.get(
          `/admin/products/${productId}`,
          adminHeaders,
        )
        expect(product.data.product.subtitle).toBe("applied subtitle")
      })

      it("leaves an action type it does not handle untouched and unstamped", async () => {
        const productId = await createProduct("Unknown Action")
        const { change } = await stageChange(productId, [
          { action: "THIRD_PARTY_ACTION", details: { anything: true } },
          { action: ProductChangeActionType.CHANGE_REQUESTED, details: {} },
        ])

        await applyProductChangeActionsWorkflow(container).run({
          input: { change_ids: [change.id] },
        })

        const actions = await readActions(change.id)
        expect(actions).toHaveLength(2)
        expect(actions.every((a) => a.applied === false)).toBe(true)
      })

      it("stamps only the handled action when a change mixes handled and unknown types", async () => {
        const productId = await createProduct("Mixed Actions")
        const { change } = await stageChange(productId, [
          {
            action: ProductChangeActionType.UPDATE,
            details: { field: "subtitle", value: "mixed subtitle" },
          },
          { action: "THIRD_PARTY_ACTION", details: {} },
        ])

        await applyProductChangeActionsWorkflow(container).run({
          input: { change_ids: [change.id] },
        })

        const actions = await readActions(change.id)
        const applied = actions.filter((a) => a.applied)
        expect(applied).toHaveLength(1)
        expect(applied[0].action).toBe(ProductChangeActionType.UPDATE)
      })

      it("persists reference / reference_id and makes them filterable", async () => {
        const productId = await createProduct("Referenced Action")
        const { change } = await stageChange(productId, [
          {
            action: ProductChangeActionType.UPDATE,
            details: { field: "subtitle", value: "referenced" },
            reference: "product_variant",
            reference_id: "variant_ref_1",
          },
          {
            action: ProductChangeActionType.UPDATE,
            details: { field: "handle", value: "referenced-handle" },
          },
        ])

        const all = await readActions(change.id)
        const unreferenced = all.find((a) => a.reference === null)
        expect(unreferenced).toBeDefined()
        expect(unreferenced!.reference_id).toBeNull()

        const query = container.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_change_action",
          fields: ["id", "reference", "reference_id"],
          filters: {
            reference: "product_variant",
            reference_id: "variant_ref_1",
          },
        })

        expect(data).toHaveLength(1)
        expect(data[0].reference).toBe("product_variant")
      })
    })
  },
})
