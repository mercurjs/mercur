import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"

import {
  applyProductAttributeChangeActionsWorkflow,
  createProductAttributesWorkflow,
  createProductsWorkflow,
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

        // axis mirror option attached, non-axis value linked
        expect(await optionAttached("Color")).toBe(true)
        expect(await valueNames()).toContain("Cotton")

        // remove the axis attribute -> mirror option detached
        await applyProductAttributeChangeActionsWorkflow(appContainer).run({
          input: {
            product_id: productId,
            add: [],
            remove: [color.id],
            update: [],
          },
        })

        expect(await optionAttached("Color")).toBe(false)
      })
    })
  },
})
