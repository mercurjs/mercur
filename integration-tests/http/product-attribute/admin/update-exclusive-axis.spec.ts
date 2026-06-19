import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"

import {
  addProductAttributesToProductWorkflow,
  createProductsWorkflow,
  updateProductAttributesOnProductWorkflow,
} from "@mercurjs/core/workflows"

jest.setTimeout(60000)

/**
 * SPEC-014 §G update branch — exclusive (product-scoped) axis value mutation.
 *
 * An inline axis attribute (`product_id` set, mirroring a native exclusive
 * `product_option`) must support deleting/adding its own values via the batch
 * `update` action. Regression guard: the exclusive plan once keyed its remove
 * lookup by `product_option_value_id` while the batch payload carries attribute
 * value ids, so `update[].remove` was silently dropped and nothing was deleted.
 *
 * Covered at the workflow level (not over HTTP) because the exclusive value
 * delete uses `updateProductOptionsStep` to re-sync the mirror, which is not
 * affected by the 2.16 options-preview `product.options(.values)` populate bug
 * that keeps the shared-axis HTTP cases skipped.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    describe("SPEC-014 updateProductAttributesOnProductWorkflow exclusive axis", () => {
      let appContainer: MedusaContainer

      beforeAll(() => {
        appContainer = getContainer()
      })

      const createProduct = async () => {
        const { result } = await createProductsWorkflow(appContainer).run({
          input: {
            products: [{ title: "Exclusive Axis Product", status: "published" }],
          },
        })
        return (result as { id: string }[])[0].id
      }

      // Read the product-scoped axis attribute + its current value rows.
      const scopedSizeAttr = async (productId: string) => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_attribute",
          fields: ["id", "name", "product_id", "values.id", "values.name"],
          filters: { product_id: productId },
        })
        const attr = (data ?? []).find(
          (a: { name: string }) => a.name === "Size",
        )
        const byName = new Map<string, string>(
          ((attr?.values ?? []) as { id: string; name: string }[]).map((v) => [
            v.name,
            v.id,
          ]),
        )
        return { id: attr?.id as string, byName }
      }

      const attributeValueExists = async (id: string) => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_attribute_value",
          fields: ["id"],
          filters: { id },
        })
        return (data ?? []).length > 0
      }

      const remainingValueNames = async (productId: string) => {
        const { byName } = await scopedSizeAttr(productId)
        return Array.from(byName.keys()).sort()
      }

      // Mirrored exclusive option value set (re-synced after value delete/add).
      const optionValues = async (title: string) => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_option",
          fields: ["title", "values.value"],
          filters: { title },
        })
        return ((data?.[0]?.values ?? []) as { value: string }[])
          .map((v) => v.value)
          .sort()
      }

      it("removes a value from an exclusive (product-scoped) axis", async () => {
        const productId = await createProduct()
        await addProductAttributesToProductWorkflow(appContainer).run({
          input: {
            product_id: productId,
            add: [
              { title: "Size", values: ["S", "M", "L"], is_variant_axis: true },
            ],
          },
        })

        const size = await scopedSizeAttr(productId)
        expect(size.id).toBeTruthy()
        const sValueId = size.byName.get("S")!
        expect(sValueId).toBeTruthy()

        await updateProductAttributesOnProductWorkflow(appContainer).run({
          input: {
            product_id: productId,
            update: [{ id: size.id, remove: [sValueId] }],
          },
        })

        // value row deleted, attribute now holds M/L, mirror option re-synced.
        expect(await attributeValueExists(sValueId)).toBe(false)
        expect(await remainingValueNames(productId)).toEqual(["L", "M"])
        expect(await optionValues("Size")).toEqual(["L", "M"])
      })

      it("adds a value to an exclusive (product-scoped) axis", async () => {
        const productId = await createProduct()
        await addProductAttributesToProductWorkflow(appContainer).run({
          input: {
            product_id: productId,
            add: [
              { title: "Size", values: ["S", "M"], is_variant_axis: true },
            ],
          },
        })

        const size = await scopedSizeAttr(productId)

        await updateProductAttributesOnProductWorkflow(appContainer).run({
          input: {
            product_id: productId,
            update: [{ id: size.id, add: [{ value: "XL" }] }],
          },
        })

        expect(await remainingValueNames(productId)).toEqual(["M", "S", "XL"])
        expect(await optionValues("Size")).toEqual(["M", "S", "XL"])
      })

      // Read the scoped attribute's current name by id.
      const attributeName = async (id: string) => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_attribute",
          fields: ["id", "name"],
          filters: { id },
        })
        return (data?.[0] as { name?: string } | undefined)?.name
      }

      it("renames an exclusive (product-scoped) axis + syncs the mirror option title", async () => {
        const productId = await createProduct()
        await addProductAttributesToProductWorkflow(appContainer).run({
          input: {
            product_id: productId,
            add: [
              { title: "Size", values: ["S", "M"], is_variant_axis: true },
            ],
          },
        })

        const size = await scopedSizeAttr(productId)

        await updateProductAttributesOnProductWorkflow(appContainer).run({
          input: {
            product_id: productId,
            // The edit form sends rename + value mutation in one update entry.
            update: [{ id: size.id, title: "Sizing", add: [{ value: "L" }] }],
          },
        })

        // Attribute renamed, mirror option title follows, value still added.
        expect(await attributeName(size.id)).toEqual("Sizing")
        expect(await optionValues("Sizing")).toEqual(["L", "M", "S"])
      })

      it("renames a product-scoped non-axis (text) attribute and swaps its value", async () => {
        const productId = await createProduct()
        await addProductAttributesToProductWorkflow(appContainer).run({
          input: {
            product_id: productId,
            add: [{ title: "Care", type: "text", value: "Hand wash" }],
          },
        })

        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_attribute",
          fields: ["id", "name"],
          filters: { product_id: productId },
        })
        const care = (data ?? []).find(
          (a: { name: string }) => a.name === "Care",
        ) as { id: string }
        expect(care?.id).toBeTruthy()

        await updateProductAttributesOnProductWorkflow(appContainer).run({
          input: {
            product_id: productId,
            update: [{ id: care.id, title: "Care Instructions", value: "Machine wash" }],
          },
        })

        expect(await attributeName(care.id)).toEqual("Care Instructions")
      })
    })
  },
})
