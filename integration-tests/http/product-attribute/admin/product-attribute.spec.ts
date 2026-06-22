import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { MercurModules } from "@mercurjs/types"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

import {
  createProductAttributesWorkflow,
  createProductAttributeValuesWorkflow,
  deleteProductAttributesWorkflow,
  updateProductAttributesWorkflow,
  upsertProductAttributeValuesWorkflow,
} from "@mercurjs/core/workflows"

jest.setTimeout(50000)

/**
 * Integration coverage for the SPEC-008 product-attribute workflow
 * group. Exercises the CRUD + upsert surface that lives at
 * `packages/core/src/workflows/product-attribute/workflows/*`.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, dbConnection }) => {
    describe("product-attribute workflow group (SPEC-008)", () => {
      let appContainer: MedusaContainer

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      it("creates a product attribute, then values via createProductAttributeValuesWorkflow", async () => {
        const { result: attributes } = await createProductAttributesWorkflow(
          appContainer,
        ).run({
          input: {
            attributes: [
              {
                name: "Size",
                handle: "size",
                type: "multi_select",
                is_variant_axis: true,
                is_filterable: true,
              },
            ],
          },
        })

        expect(attributes).toHaveLength(1)
        expect(attributes[0].name).toBe("Size")

        await createProductAttributeValuesWorkflow(appContainer).run({
          input: {
            attribute_id: attributes[0].id,
            values: [
              { name: "Small", handle: "small", rank: 0 },
              { name: "Medium", handle: "medium", rank: 1 },
            ],
          },
        })

        const module = appContainer.resolve(MercurModules.PRODUCT_ATTRIBUTE)
        const values = await module.listProductAttributeValues({
          attribute_id: attributes[0].id,
        })
        expect(values).toHaveLength(2)
        expect(values.map((v: { name: string }) => v.name).sort()).toEqual(
          ["Medium", "Small"],
        )
      })

      it("updates a product attribute scalar fields", async () => {
        const { result: created } = await createProductAttributesWorkflow(
          appContainer,
        ).run({
          input: {
            attributes: [
              {
                name: "Color",
                handle: "color",
                type: "multi_select",
                is_filterable: false,
              },
            ],
          },
        })

        await updateProductAttributesWorkflow(appContainer).run({
          input: {
            selector: { id: created[0].id },
            update: {
              is_filterable: true,
              description: "Filterable now",
            },
          },
        })

        const module = appContainer.resolve(MercurModules.PRODUCT_ATTRIBUTE)
        const refreshed = await module.retrieveProductAttribute(created[0].id)
        expect(refreshed.is_filterable).toBe(true)
        expect(refreshed.description).toBe("Filterable now")
      })

      it("upsertProductAttributeValuesWorkflow create + update in one call", async () => {
        const { result: attribute } = await createProductAttributesWorkflow(
          appContainer,
        ).run({
          input: {
            attributes: [
              {
                name: "Material",
                handle: "material",
                type: "multi_select",
              },
            ],
          },
        })

        const { result: created } =
          await createProductAttributeValuesWorkflow(appContainer).run({
            input: {
              attribute_id: attribute[0].id,
              values: [
                {
                  name: "Cotton",
                  handle: "cotton",
                  rank: 0,
                },
              ],
            },
          })

        await upsertProductAttributeValuesWorkflow(appContainer).run({
          input: {
            attribute_id: attribute[0].id,
            values: [
              { id: created[0].id, name: "Cotton (renamed)" },
              { name: "Linen", handle: "linen", rank: 1 },
            ],
          },
        })

        const module = appContainer.resolve(MercurModules.PRODUCT_ATTRIBUTE)
        const values = await module.listProductAttributeValues({
          attribute_id: attribute[0].id,
        })
        expect(values).toHaveLength(2)
        const names = values.map((v: { name: string }) => v.name).sort()
        expect(names).toEqual(["Cotton (renamed)", "Linen"])
      })

      it("deleteProductAttributesWorkflow soft-deletes attributes and dismisses links", async () => {
        const { result: created } = await createProductAttributesWorkflow(
          appContainer,
        ).run({
          input: {
            attributes: [
              {
                name: "Doomed",
                handle: "doomed",
                type: "multi_select",
              },
            ],
          },
        })

        await deleteProductAttributesWorkflow(appContainer).run({
          input: { ids: [created[0].id] },
        })

        const module = appContainer.resolve(MercurModules.PRODUCT_ATTRIBUTE)
        const remaining = await module.listProductAttributes({
          id: created[0].id,
        })
        expect(remaining).toHaveLength(0)
      })
    })
  },
})
