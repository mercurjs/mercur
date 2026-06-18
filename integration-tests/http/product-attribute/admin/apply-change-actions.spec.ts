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
            add_actions: [
              {
                product_id: productId,
                attribute_id: color.id,
                attribute_value_ids: [color.byName.get("Red")!],
              },
              {
                product_id: productId,
                attribute_id: material.id,
                attribute_value_ids: [material.byName.get("Cotton")!],
              },
            ],
            remove_actions: [],
          },
        })

        let { data } = await query.graph({
          entity: "product",
          fields: [
            "id",
            "options.title",
            "options.values.value",
            "attribute_values.name",
          ],
          filters: { id: productId },
        })
        let product = data[0]
        const colorOption = (product.options ?? []).find(
          (o: { title: string }) => o.title === "Color",
        )
        expect(colorOption).toBeTruthy()
        expect(
          (colorOption.values ?? []).map((v: { value: string }) => v.value),
        ).toContain("Red")
        expect(
          (product.attribute_values ?? []).map((v: { name: string }) => v.name),
        ).toContain("Cotton")

        // remove the axis attribute -> mirror option detached
        await applyProductAttributeChangeActionsWorkflow(appContainer).run({
          input: {
            add_actions: [],
            remove_actions: [
              { product_id: productId, attribute_id: color.id },
            ],
          },
        })

        ;({ data } = await query.graph({
          entity: "product",
          fields: ["id", "options.title"],
          filters: { id: productId },
        }))
        product = data[0]
        expect(
          (product.options ?? []).find(
            (o: { title: string }) => o.title === "Color",
          ),
        ).toBeFalsy()
      })
    })
  },
})
