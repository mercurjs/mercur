import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { MercurModules } from "@mercurjs/types"

import { createProductAttributesWorkflow } from "@mercurjs/core/workflows"

jest.setTimeout(60000)

/**
 * SPEC-014 foundation coverage: variant-axis attributes mirror to a native
 * Medusa ProductOption (and their values to ProductOptionValues) via the two
 * mirror links; non-axis attributes do not; toggle attributes are seeded with
 * exactly `true`/`false`.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    describe("SPEC-014 attribute → option mirror + toggle seeding", () => {
      let appContainer: MedusaContainer

      beforeAll(() => {
        appContainer = getContainer()
      })

      it("mirrors a multi_select variant-axis attribute to a shared ProductOption", async () => {
        const { result } = await createProductAttributesWorkflow(
          appContainer,
        ).run({
          input: {
            attributes: [
              {
                name: "Color",
                handle: "color",
                type: "multi_select",
                is_variant_axis: true,
                values: [
                  { name: "Red", rank: 0 },
                  { name: "Blue", rank: 1 },
                ],
              },
            ],
          },
        })

        const attributeId = result[0].id
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)

        const { data } = await query.graph({
          entity: "product_attribute",
          fields: [
            "id",
            "mirror_option.id",
            "mirror_option.title",
            "mirror_option.is_exclusive",
            "mirror_option.values.value",
            "values.name",
            "values.mirror_option_value.value",
          ],
          filters: { id: attributeId },
        })

        const attr = data[0]
        expect(attr.mirror_option).toBeTruthy()
        expect(attr.mirror_option.title).toBe("Color")
        // catalog axis attributes mirror to a SHARED (non-exclusive) option
        expect(attr.mirror_option.is_exclusive).toBe(false)
        expect(
          (attr.mirror_option.values ?? [])
            .map((v: { value: string }) => v.value)
            .sort(),
        ).toEqual(["Blue", "Red"])

        // each attribute value mirrors the option value of the same name
        for (const v of attr.values) {
          expect(v.mirror_option_value?.value).toBe(v.name)
        }
      })

      it("does NOT mirror a non-axis multi_select attribute", async () => {
        const { result } = await createProductAttributesWorkflow(
          appContainer,
        ).run({
          input: {
            attributes: [
              {
                name: "Material",
                type: "multi_select",
                is_variant_axis: false,
                values: [{ name: "Cotton" }],
              },
            ],
          },
        })

        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_attribute",
          fields: ["id", "mirror_option.id"],
          filters: { id: result[0].id },
        })
        expect(data[0].mirror_option).toBeFalsy()
      })

      it("seeds toggle attributes with exactly true/false (ignoring caller values)", async () => {
        const { result } = await createProductAttributesWorkflow(
          appContainer,
        ).run({
          input: {
            attributes: [
              {
                name: "Waterproof",
                type: "toggle",
                values: [{ name: "ignored" }],
              },
            ],
          },
        })

        const module = appContainer.resolve(MercurModules.PRODUCT_ATTRIBUTE)
        const values = await module.listProductAttributeValues({
          attribute_id: result[0].id,
        })
        expect(
          values.map((v: { name: string }) => v.name).sort(),
        ).toEqual(["false", "true"])
      })
    })
  },
})
