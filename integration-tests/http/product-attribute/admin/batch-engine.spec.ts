import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"

import {
  createAndLinkProductAttributesToProductWorkflow,
  createProductAttributesWorkflow,
  createProductsWorkflow,
} from "@mercurjs/core/workflows"

jest.setTimeout(60000)

/**
 * SPEC-014 §G batch engine — add/remove/update attribute edits on an existing
 * product (existing refs): non-axis value links, toggle swap, and axis mirror
 * option attach.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    describe("SPEC-014 createAndLinkProductAttributesToProductWorkflow", () => {
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
                values: (opts.values ?? []).map((name, rank) => ({ name, rank })),
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

      const createBareProduct = async () => {
        const { result } = await createProductsWorkflow(appContainer).run({
          input: {
            products: [{ title: "Batch Product", status: "published" }],
          },
        })
        return (result as { id: string }[])[0].id
      }

      const valueNamesOf = async (productId: string) => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product",
          fields: ["id", "attribute_values.name"],
          filters: { id: productId },
        })
        return ((data[0].attribute_values ?? []) as { name: string }[])
          .map((v) => v.name)
          .sort()
      }

      it("adds, updates and removes non-axis + toggle values via batch", async () => {
        const material = await createAttr({
          name: "Material",
          type: "single_select",
          values: ["Cotton", "Wool"],
        })
        const waterproof = await createAttr({ name: "Waterproof", type: "toggle" })
        const productId = await createBareProduct()

        // add
        await createAndLinkProductAttributesToProductWorkflow(appContainer).run({
          input: {
            product_id: productId,
            add: [
              { id: material.id, value_ids: [material.byName.get("Cotton")!] },
              { id: waterproof.id, value: true },
            ],
          },
        })
        expect(await valueNamesOf(productId)).toEqual(["Cotton", "true"])

        // update: swap Cotton -> Wool, toggle true -> false
        await createAndLinkProductAttributesToProductWorkflow(appContainer).run({
          input: {
            product_id: productId,
            update: [
              {
                id: material.id,
                add: [material.byName.get("Wool")!],
                remove: [material.byName.get("Cotton")!],
              },
              { id: waterproof.id, value: false },
            ],
          },
        })
        expect(await valueNamesOf(productId)).toEqual(["Wool", "false"])

        // remove material entirely
        await createAndLinkProductAttributesToProductWorkflow(appContainer).run({
          input: { product_id: productId, remove: [material.id] },
        })
        expect(await valueNamesOf(productId)).toEqual(["false"])
      })

      it("attaches an axis mirror option to a product via batch add", async () => {
        const color = await createAttr({
          name: "Color",
          type: "multi_select",
          is_variant_axis: true,
          values: ["Red", "Blue"],
        })
        const productId = await createBareProduct()

        await createAndLinkProductAttributesToProductWorkflow(appContainer).run({
          input: {
            product_id: productId,
            add: [{ id: color.id, value_ids: [color.byName.get("Red")!] }],
          },
        })

        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product",
          fields: ["id", "options.title", "options.values.value"],
          filters: { id: productId },
        })
        const colorOption = (data[0].options ?? []).find(
          (o: { title: string }) => o.title === "Color",
        )
        expect(colorOption).toBeTruthy()
        const optionValues = (colorOption.values ?? []).map(
          (v: { value: string }) => v.value,
        )
        expect(optionValues).toContain("Red")
        expect(optionValues).not.toContain("Blue")
      })
    })
  },
})
