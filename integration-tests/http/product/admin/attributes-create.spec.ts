import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"

import {
  createProductAttributesWorkflow,
  createProductsWorkflow,
} from "@mercurjs/core/workflows"

jest.setTimeout(60000)

/**
 * SPEC-014 §D: createProductsWorkflow unified `attributes[]` path (existing
 * attributes): axis attribute → native mirror option attached with the selected
 * value subset and variant resolution; non-axis select + toggle → value links.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    describe("SPEC-014 createProducts attributes[] (existing refs)", () => {
      let appContainer: MedusaContainer

      beforeAll(() => {
        appContainer = getContainer()
      })

      const createAttr = async (opts: {
        name: string
        type: "multi_select" | "single_select" | "toggle"
        is_variant_axis?: boolean
        values?: string[]
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
                values: (opts.values ?? []).map((name, rank) => ({
                  name,
                  rank,
                })),
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

      it("attaches axis mirror option + links non-axis values on create", async () => {
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
        const waterproof = await createAttr({
          name: "Waterproof",
          type: "toggle",
        })

        const { result } = await createProductsWorkflow(appContainer).run({
          input: {
            products: [
              {
                title: "Axis Product",
                status: "published",
                attributes: [
                  { id: color.id, value_ids: [color.byName.get("Red")!] },
                  {
                    id: material.id,
                    value_ids: [material.byName.get("Cotton")!],
                  },
                  { id: waterproof.id, value: true },
                ],
                variants: [{ title: "Red variant", options: { Color: "Red" } }],
              },
            ],
          },
        })

        const productId = (result as { id: string }[])[0].id
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product",
          fields: [
            "id",
            "options.title",
            "options.values.value",
            "variants.title",
            "variants.options.value",
            "attribute_values.name",
          ],
          filters: { id: productId },
        })
        const product = data[0]

        // axis attribute became a native option, restricted to the chosen value
        const colorOption = (product.options ?? []).find(
          (o: { title: string }) => o.title === "Color",
        )
        expect(colorOption).toBeTruthy()
        const optionValues = (colorOption.values ?? []).map(
          (v: { value: string }) => v.value,
        )
        expect(optionValues).toContain("Red")
        expect(optionValues).not.toContain("Blue") // per-product value subset

        // variant resolved against the mirror option value
        expect(product.variants).toHaveLength(1)
        expect(
          (product.variants[0].options ?? []).map(
            (v: { value: string }) => v.value,
          ),
        ).toEqual(["Red"])

        // non-axis selections linked as attribute values
        const linkedNames = (product.attribute_values ?? []).map(
          (v: { name: string }) => v.name,
        )
        expect(linkedNames).toContain("Cotton")
        expect(linkedNames).toContain("true")
        expect(linkedNames).not.toContain("Red") // axis value is an option, not a value link
      })
    })
  },
})
