import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  MercurModules,
  ProductChangeActionType,
  ProductChangeStatus,
} from "@mercurjs/types"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

import {
  applyProductChangeActionsWorkflow,
  createProductChangeWorkflow,
} from "../../../../packages/core/src/workflows/product-change"

jest.setTimeout(50000)

/**
 * Per-action coverage for `applyProductChangeActionsWorkflow`. This is
 * the cross-module dispatcher landed in SPEC-008
 * (`packages/core/src/workflows/product-change/workflows/
 * apply-product-change-actions.ts`).
 *
 * Each `it` block stages a single `ProductChangeAction` of one
 * `ProductChangeActionType`, runs apply over the parent change, and
 * verifies the expected side effect on the stock product entity /
 * variant table / module-link pivot.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, dbConnection }) => {
    describe("applyProductChangeActionsWorkflow — per-action dispatch", () => {
      let appContainer: MedusaContainer

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      const createProductWithDefaultVariant = async (): Promise<{
        productId: string
        variantId: string
      }> => {
        const productModule = appContainer.resolve(Modules.PRODUCT)
        const [product] = await productModule.createProducts([
          {
            title: "Apply Test Product",
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
        return { productId: product.id, variantId: product.variants[0].id }
      }

      const stageAction = async (
        productId: string,
        action: ProductChangeActionType,
        details: Record<string, unknown>,
      ): Promise<string> => {
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
            action,
            details,
          },
        ])
        return changes[0].id
      }

      it("STATUS_CHANGE → updates Product.status via updateProductsWorkflow", async () => {
        const { productId } = await createProductWithDefaultVariant()
        const changeId = await stageAction(
          productId,
          ProductChangeActionType.STATUS_CHANGE,
          { status: "published" },
        )

        await applyProductChangeActionsWorkflow(appContainer).run({
          input: { change_ids: [changeId] },
        })

        const productModule = appContainer.resolve(Modules.PRODUCT)
        const product = await productModule.retrieveProduct(productId)
        expect(product.status).toBe("published")
      })

      it("UPDATE → writes the named field on the product", async () => {
        const { productId } = await createProductWithDefaultVariant()
        const changeId = await stageAction(
          productId,
          ProductChangeActionType.UPDATE,
          { field: "title", value: "Updated Title" },
        )

        await applyProductChangeActionsWorkflow(appContainer).run({
          input: { change_ids: [changeId] },
        })

        const productModule = appContainer.resolve(Modules.PRODUCT)
        const product = await productModule.retrieveProduct(productId)
        expect(product.title).toBe("Updated Title")
      })

      it("VARIANT_ADD → creates a new variant via createProductVariantsWorkflow", async () => {
        const { productId } = await createProductWithDefaultVariant()
        const changeId = await stageAction(
          productId,
          ProductChangeActionType.VARIANT_ADD,
          {
            variant: {
              title: "Added Variant",
              manage_inventory: false,
              options: { Default: "one" },
            },
          },
        )

        await applyProductChangeActionsWorkflow(appContainer).run({
          input: { change_ids: [changeId] },
        })

        const productModule = appContainer.resolve(Modules.PRODUCT)
        const product = await productModule.retrieveProduct(productId, {
          relations: ["variants"],
        })
        expect(
          product.variants.some(
            (v: { title: string }) => v.title === "Added Variant",
          ),
        ).toBe(true)
      })

      it("VARIANT_UPDATE → updates the variant via updateProductVariantsWorkflow", async () => {
        const { productId, variantId } =
          await createProductWithDefaultVariant()
        const changeId = await stageAction(
          productId,
          ProductChangeActionType.VARIANT_UPDATE,
          { variant_id: variantId, fields: { title: "Renamed Variant" } },
        )

        await applyProductChangeActionsWorkflow(appContainer).run({
          input: { change_ids: [changeId] },
        })

        const productModule = appContainer.resolve(Modules.PRODUCT)
        const variant = await productModule.retrieveProductVariant(variantId)
        expect(variant.title).toBe("Renamed Variant")
      })

      it("VARIANT_REMOVE → soft-deletes the variant", async () => {
        const { productId, variantId } =
          await createProductWithDefaultVariant()
        const changeId = await stageAction(
          productId,
          ProductChangeActionType.VARIANT_REMOVE,
          { variant_id: variantId },
        )

        await applyProductChangeActionsWorkflow(appContainer).run({
          input: { change_ids: [changeId] },
        })

        const productModule = appContainer.resolve(Modules.PRODUCT)
        const variants = await productModule.listProductVariants({
          id: variantId,
        })
        expect(variants).toHaveLength(0)
      })

      it("ATTRIBUTE_ADD → creates product_attribute_value_link rows", async () => {
        const { productId } = await createProductWithDefaultVariant()
        const attributeModule = appContainer.resolve(
          MercurModules.PRODUCT_ATTRIBUTE,
        )
        const [attribute] = await attributeModule.createProductAttributes([
          {
            name: "Color",
            handle: "color",
            type: "multi_select",
            is_variant_axis: true,
          },
        ])
        const [value] = await attributeModule.createProductAttributeValues([
          {
            attribute_id: attribute.id,
            name: "Red",
            handle: "red",
            rank: 0,
          },
        ])

        const changeId = await stageAction(
          productId,
          ProductChangeActionType.ATTRIBUTE_ADD,
          { attribute_id: attribute.id, attribute_value_ids: [value.id] },
        )

        await applyProductChangeActionsWorkflow(appContainer).run({
          input: { change_ids: [changeId] },
        })

        const query = appContainer.resolve("query")
        const { data } = await query.graph({
          entity: "product",
          fields: [
            "id",
            "attribute_value.id",
            "variant_attribute.id",
          ],
          filters: { id: productId },
        })
        const row = data[0] as {
          attribute_value?: Array<{ id: string }>
          variant_attribute?: Array<{ id: string }>
        }
        expect(row.attribute_value?.map((v) => v.id)).toContain(value.id)
        // is_variant_axis = true → variant-attribute link also written.
        expect(row.variant_attribute?.map((a) => a.id)).toContain(
          attribute.id,
        )
      })

      it("ATTRIBUTE_REMOVE → dismisses both pivots", async () => {
        const { productId } = await createProductWithDefaultVariant()
        const attributeModule = appContainer.resolve(
          MercurModules.PRODUCT_ATTRIBUTE,
        )
        const [attribute] = await attributeModule.createProductAttributes([
          {
            name: "Color",
            handle: "color",
            type: "multi_select",
            is_variant_axis: true,
          },
        ])
        const [value] = await attributeModule.createProductAttributeValues([
          {
            attribute_id: attribute.id,
            name: "Red",
            handle: "red",
            rank: 0,
          },
        ])

        // First add the attribute so there's something to remove.
        await applyProductChangeActionsWorkflow(appContainer).run({
          input: {
            change_ids: [
              await stageAction(
                productId,
                ProductChangeActionType.ATTRIBUTE_ADD,
                {
                  attribute_id: attribute.id,
                  attribute_value_ids: [value.id],
                },
              ),
            ],
          },
        })

        const removeChangeId = await stageAction(
          productId,
          ProductChangeActionType.ATTRIBUTE_REMOVE,
          { attribute_id: attribute.id },
        )

        await applyProductChangeActionsWorkflow(appContainer).run({
          input: { change_ids: [removeChangeId] },
        })

        const query = appContainer.resolve("query")
        const { data } = await query.graph({
          entity: "product",
          fields: ["id", "attribute_value.id", "variant_attribute.id"],
          filters: { id: productId },
        })
        const row = data[0] as {
          attribute_value?: Array<{ id: string }>
          variant_attribute?: Array<{ id: string }>
        }
        expect(row.attribute_value ?? []).toHaveLength(0)
        expect(row.variant_attribute ?? []).toHaveLength(0)
      })

      it("PRODUCT_DELETE → soft-deletes the product last (audit-trail safe)", async () => {
        const { productId } = await createProductWithDefaultVariant()
        const changeId = await stageAction(
          productId,
          ProductChangeActionType.PRODUCT_DELETE,
          {},
        )

        await applyProductChangeActionsWorkflow(appContainer).run({
          input: { change_ids: [changeId] },
        })

        const productModule = appContainer.resolve(Modules.PRODUCT)
        const products = await productModule.listProducts({ id: productId })
        expect(products).toHaveLength(0)
      })

      it("marks every dispatched action applied=true", async () => {
        const { productId } = await createProductWithDefaultVariant()
        const changeId = await stageAction(
          productId,
          ProductChangeActionType.UPDATE,
          { field: "subtitle", value: "Marked applied" },
        )

        await applyProductChangeActionsWorkflow(appContainer).run({
          input: { change_ids: [changeId] },
        })

        const changeModule = appContainer.resolve(MercurModules.PRODUCT_CHANGE)
        const actions = await changeModule.listProductChangeActions({
          product_change_id: changeId,
        })
        expect(actions.every((a: { applied: boolean }) => a.applied)).toBe(
          true,
        )
      })

      it("re-applies are idempotent (no double-applied side effects)", async () => {
        const { productId } = await createProductWithDefaultVariant()
        const changeId = await stageAction(
          productId,
          ProductChangeActionType.UPDATE,
          { field: "title", value: "Once" },
        )

        await applyProductChangeActionsWorkflow(appContainer).run({
          input: { change_ids: [changeId] },
        })

        // Second invocation: actions are now applied=true and the
        // workflow filters them out → no-op.
        await applyProductChangeActionsWorkflow(appContainer).run({
          input: { change_ids: [changeId] },
        })

        const productModule = appContainer.resolve(Modules.PRODUCT)
        const product = await productModule.retrieveProduct(productId)
        expect(product.title).toBe("Once")
      })
    })
  },
})
