import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin Products — Mercur wrappers", () => {
      let appContainer: MedusaContainer

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      describe("POST /admin/products", () => {
        it("creates a simple product (default option + variant injected, manage_inventory=false)", async () => {
          const res = await api.post(
            `/admin/products`,
            { title: "Simple" },
            adminHeaders
          )

          expect(res.status).toBe(200)
          expect(res.data.product.title).toBe("Simple")
          expect(Array.isArray(res.data.product.options)).toBe(true)
          expect(res.data.product.options.length).toBeGreaterThanOrEqual(1)
          expect(res.data.product.options[0].title).toBe("Default option")
          expect(res.data.product.variants.length).toBeGreaterThanOrEqual(1)
          for (const v of res.data.product.variants) {
            expect(v.manage_inventory).toBe(false)
          }
        })

        it("creates a product with stock options + variants pinned manage_inventory=false", async () => {
          const res = await api.post(
            `/admin/products`,
            {
              title: "T-Shirt",
              options: [{ title: "Size", values: ["S", "M"] }],
              variants: [
                { title: "Small", options: { Size: "S" } },
                { title: "Medium", options: { Size: "M" } },
              ],
            },
            adminHeaders
          )

          expect(res.status).toBe(200)
          expect(res.data.product.variants).toHaveLength(2)
          for (const v of res.data.product.variants) {
            expect(v.manage_inventory).toBe(false)
          }
        })

        it("inline-custom variant_attributes become stock options", async () => {
          const res = await api.post(
            `/admin/products`,
            {
              title: "Inline Custom",
              variant_attributes: [
                {
                  name: "Color",
                  type: "multi_select",
                  is_variant_axis: true,
                  values: ["Red", "Blue"],
                },
              ],
              variants: [
                { title: "Red", options: { Color: "Red" } },
                { title: "Blue", options: { Color: "Blue" } },
              ],
            },
            adminHeaders
          )

          expect(res.status).toBe(200)
          const colorOption = res.data.product.options.find(
            (o: any) => o.title === "Color"
          )
          expect(colorOption).toBeDefined()
          expect(colorOption.values.map((v: any) => v.value).sort()).toEqual([
            "Blue",
            "Red",
          ])
        })

        it("global product_attributes write product_attribute_value_link rows", async () => {
          const attrRes = await api.post(
            `/admin/product-attributes`,
            { name: "Material", type: "multi_select", is_variant_axis: false },
            adminHeaders
          )
          const attributeId = attrRes.data.product_attribute.id

          const valsRes = await api.post(
            `/admin/product-attributes/${attributeId}/values`,
            { values: [{ name: "Cotton" }, { name: "Linen" }] },
            adminHeaders
          )
          const cottonId = valsRes.data.product_attribute.values.find(
            (v: any) => v.name === "Cotton"
          ).id

          const createRes = await api.post(
            `/admin/products`,
            {
              title: "Material Test",
              product_attributes: [
                { attribute_id: attributeId, value_ids: [cottonId] },
              ],
            },
            adminHeaders
          )
          expect(createRes.status).toBe(200)
          const productId = createRes.data.product.id

          const fetched = await api.get(
            `/admin/products/${productId}?fields=id,*attribute_values,*attribute_values.attribute`,
            adminHeaders
          )

          const values = fetched.data.product.attribute_values ?? []
          const valueIds = values.map((v: any) => v.id)
          expect(valueIds).toContain(cottonId)
        })
      })

      describe("POST /admin/products/:id", () => {
        it("updates a product through the Mercur wrapper", async () => {
          const create = await api.post(
            `/admin/products`,
            { title: "Original" },
            adminHeaders
          )
          const id = create.data.product.id

          const update = await api.post(
            `/admin/products/${id}`,
            { title: "Updated" },
            adminHeaders
          )

          expect(update.status).toBe(200)
          expect(update.data.product.title).toBe("Updated")
        })
      })

      describe("DELETE /admin/products/:id", () => {
        it("deletes a product through the Mercur wrapper", async () => {
          const create = await api.post(
            `/admin/products`,
            { title: "To Delete" },
            adminHeaders
          )
          const id = create.data.product.id

          const del = await api.delete(`/admin/products/${id}`, adminHeaders)
          expect(del.status).toBe(200)
          expect(del.data.deleted).toBe(true)
          expect(del.data.id).toBe(id)
        })
      })
    })
  },
})
