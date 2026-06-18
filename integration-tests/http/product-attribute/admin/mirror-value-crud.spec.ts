import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"

import {
  createProductAttributesWorkflow,
  createProductAttributeValuesWorkflow,
  deleteProductAttributeValuesWorkflow,
  updateProductAttributesWorkflow,
  updateProductAttributeValuesWorkflow,
} from "@mercurjs/core/workflows"

jest.setTimeout(60000)

/**
 * SPEC-014 §F-cont: option-value mirror maintenance through value CRUD and
 * axis flip-on. Also empirically validates the 2.16 option-value API
 * (createProductOptionValues with option_id, update/delete option values).
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    describe("SPEC-014 mirror maintenance (value CRUD + axis flip)", () => {
      let appContainer: MedusaContainer

      const optionValuesOf = async (attributeId: string) => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_attribute",
          fields: [
            "id",
            "mirror_option.id",
            "mirror_option.values.value",
            "values.id",
            "values.name",
            "values.mirror_option_value.value",
          ],
          filters: { id: attributeId },
        })
        return data[0]
      }

      const createAxisAttr = async () => {
        const { result } = await createProductAttributesWorkflow(
          appContainer,
        ).run({
          input: {
            attributes: [
              {
                name: "Color",
                type: "multi_select",
                is_variant_axis: true,
                values: [{ name: "Red", rank: 0 }],
              },
            ],
          },
        })
        return result[0].id
      }

      beforeAll(() => {
        appContainer = getContainer()
      })

      it("adding a value to an axis attribute mirrors it onto the option", async () => {
        const attributeId = await createAxisAttr()

        const { result: created } = await createProductAttributeValuesWorkflow(
          appContainer,
        ).run({
          input: { attribute_id: attributeId, values: [{ name: "Blue" }] },
        })

        const attr = await optionValuesOf(attributeId)
        expect(
          (attr.mirror_option.values ?? [])
            .map((v: { value: string }) => v.value)
            .sort(),
        ).toEqual(["Blue", "Red"])
        const blue = attr.values.find(
          (v: { name: string }) => v.name === "Blue",
        )
        expect(blue.id).toBe(created[0].id)
        expect(blue.mirror_option_value?.value).toBe("Blue")
      })

      it("renaming an axis value renames the mirror option value in place", async () => {
        const attributeId = await createAxisAttr()
        const { result: created } = await createProductAttributeValuesWorkflow(
          appContainer,
        ).run({
          input: { attribute_id: attributeId, values: [{ name: "Blue" }] },
        })

        await updateProductAttributeValuesWorkflow(appContainer).run({
          input: { selector: { id: created[0].id }, update: { name: "Navy" } },
        })

        const attr = await optionValuesOf(attributeId)
        const renamed = attr.values.find(
          (v: { id: string }) => v.id === created[0].id,
        )
        expect(renamed.name).toBe("Navy")
        expect(renamed.mirror_option_value?.value).toBe("Navy")
        expect(
          (attr.mirror_option.values ?? []).map((v: { value: string }) => v.value),
        ).toContain("Navy")
      })

      it("deleting an axis value removes the mirror option value", async () => {
        const attributeId = await createAxisAttr()
        const { result: created } = await createProductAttributeValuesWorkflow(
          appContainer,
        ).run({
          input: { attribute_id: attributeId, values: [{ name: "Green" }] },
        })

        await deleteProductAttributeValuesWorkflow(appContainer).run({
          input: { ids: [created[0].id] },
        })

        const attr = await optionValuesOf(attributeId)
        expect(
          (attr.mirror_option.values ?? []).map((v: { value: string }) => v.value),
        ).not.toContain("Green")
      })

      it("flipping is_variant_axis on creates the option mirror", async () => {
        const { result } = await createProductAttributesWorkflow(
          appContainer,
        ).run({
          input: {
            attributes: [
              {
                name: "Finish",
                type: "multi_select",
                is_variant_axis: false,
                values: [{ name: "Matte", rank: 0 }, { name: "Gloss", rank: 1 }],
              },
            ],
          },
        })
        const attributeId = result[0].id

        // not mirrored yet
        let attr = await optionValuesOf(attributeId)
        expect(attr.mirror_option).toBeFalsy()

        await updateProductAttributesWorkflow(appContainer).run({
          input: { selector: { id: attributeId }, update: { is_variant_axis: true } },
        })

        attr = await optionValuesOf(attributeId)
        expect(attr.mirror_option).toBeTruthy()
        expect(
          (attr.mirror_option.values ?? [])
            .map((v: { value: string }) => v.value)
            .sort(),
        ).toEqual(["Gloss", "Matte"])
        for (const v of attr.values) {
          expect(v.mirror_option_value?.value).toBe(v.name)
        }
      })

      it("flipping is_variant_axis off tears the option mirror down", async () => {
        const attributeId = await createAxisAttr()

        // mirrored after create
        let attr = await optionValuesOf(attributeId)
        expect(attr.mirror_option).toBeTruthy()

        await updateProductAttributesWorkflow(appContainer).run({
          input: {
            selector: { id: attributeId },
            update: { is_variant_axis: false },
          },
        })

        attr = await optionValuesOf(attributeId)
        expect(attr.mirror_option).toBeFalsy()
        for (const v of attr.values) {
          expect(v.mirror_option_value).toBeFalsy()
        }
      })
    })
  },
})
