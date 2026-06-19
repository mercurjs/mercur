import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"

import {
  addProductAttributesToProductWorkflow,
  applyProductAttributeChangeActionsWorkflow,
  createProductAttributesWorkflow,
  createProductsWorkflow,
  removeProductAttributesFromProductWorkflow,
} from "@mercurjs/core/workflows"

jest.setTimeout(60000)

/**
 * SPEC-014 §H: the confirm-time apply dispatcher now uses the native-option
 * model (axis → mirror option attach/detach; non-axis → value links), matching
 * the direct batch engine. This is the vendor approval-queue apply path.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    describe("SPEC-014 applyProductAttributeChangeActionsWorkflow", () => {
      let appContainer: MedusaContainer

      beforeAll(() => {
        appContainer = getContainer()
      })

      const createAttr = async (opts: {
        name: string
        type: "multi_select" | "single_select"
        is_variant_axis?: boolean
        values: string[]
      }) => {
        const { result } = await createProductAttributesWorkflow(
          appContainer,
        ).run({
          input: {
            attributes: [
              {
                name: opts.name,
                type: opts.type,
                is_variant_axis: opts.is_variant_axis ?? false,
                values: opts.values.map((name, rank) => ({ name, rank })),
              },
            ],
          },
        })
        const id = result[0].id
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_attribute",
          fields: ["id", "values.id", "values.name"],
          filters: { id },
        })
        const byName = new Map<string, string>(
          (data[0].values ?? []).map((v: { id: string; name: string }) => [
            v.name,
            v.id,
          ]),
        )
        return { id, byName }
      }

      it("applies add then remove actions on the native-option model", async () => {
        const color = await createAttr({
          name: "Color",
          type: "multi_select",
          is_variant_axis: true,
          values: ["Red", "Blue"],
        })
        const material = await createAttr({
          name: "Material",
          type: "single_select",
          values: ["Cotton", "Wool"],
        })
        const { result } = await createProductsWorkflow(appContainer).run({
          input: { products: [{ title: "Change Product", status: "published" }] },
        })
        const productId = (result as { id: string }[])[0].id
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)

        await applyProductAttributeChangeActionsWorkflow(appContainer).run({
          input: {
            product_id: productId,
            add: [
              { id: color.id, value_ids: [color.byName.get("Red")!] },
              { id: material.id, value_ids: [material.byName.get("Cotton")!] },
            ],
            remove: [],
            update: [],
          },
        })

        // Axis attachment is read from the ProductOption side (the
        // `product.options` populate is broken on the 2.16 preview build).
        const optionAttached = async (title: string) => {
          const { data } = await query.graph({
            entity: "product_option",
            fields: ["id", "title", "products.id"],
            filters: { title },
          })
          return (data ?? []).some(
            (o: { title: string; products?: { id: string }[] }) =>
              o.title === title &&
              (o.products ?? []).some((p) => p.id === productId),
          )
        }
        const valueNames = async () => {
          const { data } = await query.graph({
            entity: "product",
            fields: ["id", "product_attribute_values.name"],
            filters: { id: productId },
          })
          return ((data[0].product_attribute_values ?? []) as {
            name: string
          }[]).map((v) => v.name)
        }

        // axis mirror option attached, non-axis value linked, AND the selected
        // axis value is linked into the pivot too (so the formatter can surface
        // the axis "selected of available").
        expect(await optionAttached("Color")).toBe(true)
        expect(await valueNames()).toContain("Cotton")
        expect(await valueNames()).toContain("Red")

        // remove the axis attribute -> mirror option detached AND its pivot
        // value link dismissed (Red gone, the non-axis Cotton link stays).
        await applyProductAttributeChangeActionsWorkflow(appContainer).run({
          input: {
            product_id: productId,
            add: [],
            remove: [color.id],
            update: [],
          },
        })

        expect(await optionAttached("Color")).toBe(false)
        expect(await valueNames()).not.toContain("Red")
        expect(await valueNames()).toContain("Cotton")
      })

      // Regression: a product-scoped inline axis attribute owns an exclusive
      // native option whose product↔option pivot must be detached before the
      // option can be torn down. Previously the remove path deleted the
      // attribute (and its option) directly, so Medusa rejected with "Cannot
      // delete product options that are associated with products."
      it("removes a scoped inline axis attribute and its native option", async () => {
        const { result } = await createProductsWorkflow(appContainer).run({
          input: { products: [{ title: "Scoped Axis Product", status: "published" }] },
        })
        const productId = (result as { id: string }[])[0].id
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)

        await addProductAttributesToProductWorkflow(appContainer).run({
          input: {
            product_id: productId,
            add: [
              {
                title: "Size",
                is_variant_axis: true,
                values: ["S", "M"],
              },
            ],
          },
        })

        // The inline axis create made a product-scoped attribute backed by a
        // native option. Grab both ids to assert teardown.
        const { data: scopedAttrs } = await query.graph({
          entity: "product_attribute",
          fields: ["id", "name", "product_option_id"],
          filters: { product_id: productId },
        })
        const sizeAttr = (scopedAttrs ?? []).find(
          (a: { name: string }) => a.name === "Size",
        ) as { id: string; product_option_id: string } | undefined
        expect(sizeAttr).toBeDefined()
        expect(sizeAttr!.product_option_id).toBeTruthy()

        // This previously threw the "associated with products" INVALID_DATA error.
        await removeProductAttributesFromProductWorkflow(appContainer).run({
          input: { product_id: productId, remove: [sizeAttr!.id] },
        })

        const { data: remainingAttrs } = await query.graph({
          entity: "product_attribute",
          fields: ["id"],
          filters: { id: sizeAttr!.id },
        })
        expect(remainingAttrs ?? []).toHaveLength(0)

        const { data: remainingOptions } = await query.graph({
          entity: "product_option",
          fields: ["id"],
          filters: { id: sizeAttr!.product_option_id },
        })
        expect(remainingOptions ?? []).toHaveLength(0)
      })
    })
  },
})
