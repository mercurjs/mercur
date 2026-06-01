import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin Products — attribute wrappers (4 cases)", () => {
      let appContainer: MedusaContainer

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      const createGlobalAttribute = async (opts: {
        name: string
        type: "single_select" | "multi_select" | "text" | "toggle" | "unit"
        is_variant_axis?: boolean
        values?: string[]
      }) => {
        const created = await api.post(
          `/admin/product-attributes`,
          {
            name: opts.name,
            type: opts.type,
            is_variant_axis: opts.is_variant_axis ?? false,
          },
          adminHeaders,
        )
        const attribute_id = created.data.product_attribute.id
        const values = opts.values?.length
          ? (
              await api.post(
                `/admin/product-attributes/${attribute_id}/values`,
                { values: opts.values.map((name) => ({ name })) },
                adminHeaders,
              )
            ).data.product_attribute.values
          : []
        const byName = new Map<string, string>(
          (values as Array<{ id: string; name: string }>).map((v) => [
            v.name,
            v.id,
          ]),
        )
        return { attribute_id, values, byName }
      }

      describe("POST /admin/products", () => {
        it("creates a simple product (default option + variant injected, manage_inventory=false)", async () => {
          const res = await api.post(
            `/admin/products`,
            { title: "Simple" },
            adminHeaders,
          )
          expect(res.status).toBe(200)
          expect(res.data.product.title).toBe("Simple")
          expect(res.data.product.options.length).toBeGreaterThanOrEqual(1)
          expect(res.data.product.options[0].title).toBe("Default option")
          for (const v of res.data.product.variants) {
            expect(v.manage_inventory).toBe(false)
          }
        })

        // --- Case A: existing variant-axis attribute ---
        it("(A) existing variant-axis: synthesizes stock options + links the chosen values", async () => {
          const color = await createGlobalAttribute({
            name: "Color",
            type: "multi_select",
            is_variant_axis: true,
            values: ["Red", "Blue", "Green"],
          })

          const create = await api.post(
            `/admin/products`,
            {
              title: "Admin T-Shirt",
              variants: [
                { title: "Red", attribute_values: { Color: "Red" } },
                { title: "Blue", attribute_values: { Color: "Blue" } },
              ],
              variant_attributes: [
                {
                  attribute_id: color.attribute_id,
                  value_ids: [
                    color.byName.get("Red")!,
                    color.byName.get("Blue")!,
                  ],
                },
              ],
            },
            adminHeaders,
          )
          expect(create.status).toBe(200)
          const productId = create.data.product.id

          const opt = create.data.product.options.find(
            (o: any) => o.title === "Color",
          )
          expect(opt.values.map((v: any) => v.value).sort()).toEqual([
            "Blue",
            "Red",
          ])

          const got = await api.get(
            `/admin/products/${productId}`,
            adminHeaders,
          )
          const attrs = got.data.product.attributes
          expect(attrs).toHaveLength(1)
          expect(attrs[0].name).toBe("Color")
          expect(attrs[0].is_variant_axis).toBe(true)
          expect(attrs[0].values.map((v: any) => v.name).sort()).toEqual([
            "Blue",
            "Red",
          ])
          expect(attrs[0].all_values.map((v: any) => v.name).sort()).toEqual([
            "Blue",
            "Green",
            "Red",
          ])
        })

        // --- Case B: inline custom variant-axis attribute ---
        it("(B) inline custom variant-axis: creates a product-scoped attribute + values, hidden from the global catalogue", async () => {
          const create = await api.post(
            `/admin/products`,
            {
              title: "Admin Custom Axis",
              variants: [
                { title: "Small", attribute_values: { Fit: "Slim" } },
                { title: "Medium", attribute_values: { Fit: "Loose" } },
              ],
              variant_attributes: [
                {
                  name: "Fit",
                  type: "multi_select",
                  values: ["Slim", "Loose"],
                  is_variant_axis: true,
                },
              ],
            },
            adminHeaders,
          )
          expect(create.status).toBe(200)
          const productId = create.data.product.id

          const opt = create.data.product.options.find(
            (o: any) => o.title === "Fit",
          )
          expect(opt.values.map((v: any) => v.value).sort()).toEqual([
            "Loose",
            "Slim",
          ])

          const got = await api.get(
            `/admin/products/${productId}`,
            adminHeaders,
          )
          const attrs = got.data.product.attributes
          expect(attrs).toHaveLength(1)
          expect(attrs[0].name).toBe("Fit")

          const list = await api.get(`/admin/product-attributes`, adminHeaders)
          const names = (list.data.product_attributes ?? []).map(
            (a: any) => a.name,
          )
          expect(names).not.toContain("Fit")
        })

        // --- Case C: existing product (non-axis) attribute ---
        it("(C) existing product-level: links values only, no extra options", async () => {
          const material = await createGlobalAttribute({
            name: "Material",
            type: "multi_select",
            is_variant_axis: false,
            values: ["Cotton", "Linen", "Polyester"],
          })

          const create = await api.post(
            `/admin/products`,
            {
              title: "Material Test",
              product_attributes: [
                {
                  attribute_id: material.attribute_id,
                  value_ids: [material.byName.get("Cotton")!],
                },
              ],
            },
            adminHeaders,
          )
          expect(create.status).toBe(200)
          const productId = create.data.product.id

          // Non-axis attribute should not create a stock product option.
          const opt = create.data.product.options.find(
            (o: any) => o.title === "Material",
          )
          expect(opt).toBeUndefined()

          const got = await api.get(
            `/admin/products/${productId}`,
            adminHeaders,
          )
          const attrs = got.data.product.attributes
          expect(attrs).toHaveLength(1)
          expect(attrs[0].name).toBe("Material")
          expect(attrs[0].is_variant_axis).toBe(false)
          expect(attrs[0].values.map((v: any) => v.name)).toEqual(["Cotton"])
        })

        // --- Case D: inline custom product (non-axis) attribute ---
        it("(D) inline custom product-level: creates a product-scoped attribute + values, hidden from the global catalogue", async () => {
          const create = await api.post(
            `/admin/products`,
            {
              title: "Admin Inline Note",
              product_attributes: [
                {
                  name: "OriginNote",
                  type: "text",
                  values: ["Handmade in Italy"],
                  is_variant_axis: false,
                },
              ],
            },
            adminHeaders,
          )
          expect(create.status).toBe(200)
          const productId = create.data.product.id

          const got = await api.get(
            `/admin/products/${productId}`,
            adminHeaders,
          )
          const attrs = got.data.product.attributes
          expect(attrs).toHaveLength(1)
          expect(attrs[0].name).toBe("OriginNote")
          expect(attrs[0].values.map((v: any) => v.name)).toEqual([
            "Handmade in Italy",
          ])

          const list = await api.get(`/admin/product-attributes`, adminHeaders)
          const names = (list.data.product_attributes ?? []).map(
            (a: any) => a.name,
          )
          expect(names).not.toContain("OriginNote")
        })
      })

      describe("POST /admin/products/:id (update — replace attribute value links)", () => {
        it("replaces previously-linked values when the update payload changes them", async () => {
          const size = await createGlobalAttribute({
            name: "Size",
            type: "multi_select",
            is_variant_axis: true,
            values: ["S", "M", "L"],
          })

          const create = await api.post(
            `/admin/products`,
            {
              title: "Updatable Admin",
              variants: [
                { title: "S", attribute_values: { Size: "S" } },
                { title: "M", attribute_values: { Size: "M" } },
                { title: "L", attribute_values: { Size: "L" } },
              ],
              variant_attributes: [
                {
                  attribute_id: size.attribute_id,
                  value_ids: [
                    size.byName.get("S")!,
                    size.byName.get("M")!,
                    size.byName.get("L")!,
                  ],
                },
              ],
            },
            adminHeaders,
          )
          const productId = create.data.product.id

          await api.post(
            `/admin/products/${productId}`,
            {
              variant_attributes: [
                {
                  attribute_id: size.attribute_id,
                  value_ids: [size.byName.get("S")!],
                },
              ],
            },
            adminHeaders,
          )

          const got = await api.get(
            `/admin/products/${productId}`,
            adminHeaders,
          )
          const attrs = got.data.product.attributes
          expect(attrs).toHaveLength(1)
          expect(attrs[0].values.map((v: any) => v.name)).toEqual(["S"])
        })

        it("updates a product through the Mercur wrapper (title only)", async () => {
          const create = await api.post(
            `/admin/products`,
            { title: "Original" },
            adminHeaders,
          )
          const id = create.data.product.id
          const update = await api.post(
            `/admin/products/${id}`,
            { title: "Updated" },
            adminHeaders,
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
            adminHeaders,
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
