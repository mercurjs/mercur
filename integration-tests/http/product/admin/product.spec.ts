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
        // Single-call inline-values path. The create-attribute workflow
        // materialises the value rows after the attribute itself —
        // no separate POST to `/values` needed.
        const created = await api.post(
          `/admin/product-attributes`,
          {
            name: opts.name,
            type: opts.type,
            is_variant_axis: opts.is_variant_axis ?? false,
            values: (opts.values ?? []).map((name, idx) => ({
              name,
              rank: idx,
            })),
          },
          adminHeaders,
        )
        const attribute_id = created.data.product_attribute.id
        const values =
          (created.data.product_attribute.values as
            | Array<{ id: string; name: string }>
            | undefined) ?? []
        const byName = new Map<string, string>(
          values.map((v) => [v.name, v.id]),
        )
        return { attribute_id, values, byName }
      }

      describe("POST /admin/product-attributes (inline values)", () => {
        it("creates the attribute AND its values in a single request", async () => {
          const res = await api.post(
            `/admin/product-attributes`,
            {
              name: "Finish",
              type: "multi_select",
              is_variant_axis: false,
              values: [
                { name: "Matte", rank: 0 },
                { name: "Glossy", rank: 1 },
                { name: "Satin", rank: 2 },
              ],
            },
            adminHeaders,
          )

          expect(res.status).toBe(200)
          const attr = res.data.product_attribute
          expect(attr.name).toBe("Finish")
          expect(attr.values).toHaveLength(3)
          expect(attr.values.map((v: any) => v.name).sort()).toEqual([
            "Glossy",
            "Matte",
            "Satin",
          ])
          // Each value belongs to the just-created attribute.
          for (const v of attr.values) {
            expect(typeof v.id).toBe("string")
          }
        })

        it("creates the attribute with no values when the array is empty / omitted", async () => {
          const res = await api.post(
            `/admin/product-attributes`,
            { name: "Notes", type: "text" },
            adminHeaders,
          )
          expect(res.status).toBe(200)
          expect(res.data.product_attribute.values ?? []).toEqual([])
        })
      })

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

      // --- Dedicated attribute sub-resource endpoints ---
      //
      // These endpoints sit alongside the product create/update payload
      // pathways (covered above) and let callers attach/detach values
      // after the product already exists.

      describe("GET /admin/products/:id/attributes", () => {
        it("returns an empty list when the product has no linked attribute values", async () => {
          const create = await api.post(
            `/admin/products`,
            { title: "No Attributes" },
            adminHeaders,
          )
          const productId = create.data.product.id

          const res = await api.get(
            `/admin/products/${productId}/attributes`,
            adminHeaders,
          )
          expect(res.status).toBe(200)
          expect(res.data.product_attributes).toEqual([])
          expect(res.data.count).toBe(0)
        })

        it("returns linked attributes grouped with only the attached values", async () => {
          const color = await createGlobalAttribute({
            name: "Color",
            type: "multi_select",
            is_variant_axis: false,
            values: ["Red", "Blue", "Green"],
          })

          const create = await api.post(
            `/admin/products`,
            {
              title: "Listed Attrs",
              product_attributes: [
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
          const productId = create.data.product.id

          const res = await api.get(
            `/admin/products/${productId}/attributes`,
            adminHeaders,
          )
          expect(res.status).toBe(200)
          expect(res.data.product_attributes).toHaveLength(1)
          const attr = res.data.product_attributes[0]
          expect(attr.id).toBe(color.attribute_id)
          expect(attr.name).toBe("Color")
          expect(attr.values.map((v: any) => v.name).sort()).toEqual([
            "Blue",
            "Red",
          ])
        })

        it("404s for an unknown product id", async () => {
          const res = await api
            .get(
              `/admin/products/prod_does_not_exist/attributes`,
              adminHeaders,
            )
            .catch((e) => e.response)
          expect(res.status).toBe(404)
        })
      })

      describe("POST /admin/products/:id/attributes", () => {
        it("attaches existing values by attribute_value_ids", async () => {
          const material = await createGlobalAttribute({
            name: "Material",
            type: "multi_select",
            is_variant_axis: false,
            values: ["Cotton", "Linen", "Polyester"],
          })

          const create = await api.post(
            `/admin/products`,
            { title: "Attach By IDs" },
            adminHeaders,
          )
          const productId = create.data.product.id

          const res = await api.post(
            `/admin/products/${productId}/attributes`,
            {
              attribute_id: material.attribute_id,
              attribute_value_ids: [
                material.byName.get("Cotton")!,
                material.byName.get("Linen")!,
              ],
            },
            adminHeaders,
          )
          expect(res.status).toBe(201)
          expect(res.data.product.id).toBe(productId)

          const got = await api.get(
            `/admin/products/${productId}/attributes`,
            adminHeaders,
          )
          expect(got.data.product_attributes).toHaveLength(1)
          expect(
            got.data.product_attributes[0].values
              .map((v: any) => v.name)
              .sort(),
          ).toEqual(["Cotton", "Linen"])
        })

        it("attaches values by inline `values` names (text attribute upsert by name)", async () => {
          // For text/unit/toggle types the caller can pass `values: string[]`
          // and the route resolves them to ids via attribute_id+name.
          // We pre-create the values so the lookup finds them.
          const note = await createGlobalAttribute({
            name: "Note",
            type: "text",
            is_variant_axis: false,
            values: ["Handmade", "Imported"],
          })

          const create = await api.post(
            `/admin/products`,
            { title: "Attach By Names" },
            adminHeaders,
          )
          const productId = create.data.product.id

          const res = await api.post(
            `/admin/products/${productId}/attributes`,
            {
              attribute_id: note.attribute_id,
              values: ["Handmade"],
            },
            adminHeaders,
          )
          expect(res.status).toBe(201)

          const got = await api.get(
            `/admin/products/${productId}/attributes`,
            adminHeaders,
          )
          expect(got.data.product_attributes).toHaveLength(1)
          expect(
            got.data.product_attributes[0].values.map((v: any) => v.name),
          ).toEqual(["Handmade"])
        })

        it("is a no-op when neither attribute_value_ids nor values are provided", async () => {
          const color = await createGlobalAttribute({
            name: "Color2",
            type: "multi_select",
            is_variant_axis: false,
            values: ["X"],
          })

          const create = await api.post(
            `/admin/products`,
            { title: "Noop Attach" },
            adminHeaders,
          )
          const productId = create.data.product.id

          const res = await api.post(
            `/admin/products/${productId}/attributes`,
            { attribute_id: color.attribute_id },
            adminHeaders,
          )
          expect(res.status).toBe(201)

          const got = await api.get(
            `/admin/products/${productId}/attributes`,
            adminHeaders,
          )
          expect(got.data.product_attributes).toEqual([])
        })

        // --- Inline-create branch: materialise a product-scoped
        // attribute + values and link them to the product in one call.
        it("inline creates a product-scoped non-axis attribute and attaches its values", async () => {
          const create = await api.post(
            `/admin/products`,
            { title: "Inline Attach Note" },
            adminHeaders,
          )
          const productId = create.data.product.id

          const res = await api.post(
            `/admin/products/${productId}/attributes`,
            {
              name: "InlineNote",
              type: "text",
              values: ["Handmade in Italy"],
              is_variant_axis: false,
            },
            adminHeaders,
          )
          expect(res.status).toBe(201)
          expect(res.data.product.id).toBe(productId)

          const got = await api.get(
            `/admin/products/${productId}/attributes`,
            adminHeaders,
          )
          expect(got.data.product_attributes).toHaveLength(1)
          expect(got.data.product_attributes[0].name).toBe("InlineNote")
          expect(
            got.data.product_attributes[0].values.map((v: any) => v.name),
          ).toEqual(["Handmade in Italy"])

          // Product-scoped attributes must NOT leak into the global catalogue.
          const list = await api.get(`/admin/product-attributes`, adminHeaders)
          const names = (list.data.product_attributes ?? []).map(
            (a: any) => a.name,
          )
          expect(names).not.toContain("InlineNote")
        })

        it("inline creates a variant-axis attribute and synthesises a stock option", async () => {
          const create = await api.post(
            `/admin/products`,
            { title: "Inline Attach Axis" },
            adminHeaders,
          )
          const productId = create.data.product.id

          const res = await api.post(
            `/admin/products/${productId}/attributes`,
            {
              name: "InlineFit",
              type: "multi_select",
              values: ["Slim", "Loose"],
              is_variant_axis: true,
            },
            adminHeaders,
          )
          expect(res.status).toBe(201)

          const got = await api.get(
            `/admin/products/${productId}/attributes`,
            adminHeaders,
          )
          expect(got.data.product_attributes).toHaveLength(1)
          expect(got.data.product_attributes[0].name).toBe("InlineFit")
          expect(got.data.product_attributes[0].is_variant_axis).toBe(true)
          expect(
            got.data.product_attributes[0].values
              .map((v: any) => v.name)
              .sort(),
          ).toEqual(["Loose", "Slim"])
        })

        it("rejects an inline-create body that is missing `type`", async () => {
          const create = await api.post(
            `/admin/products`,
            { title: "Inline Bad" },
            adminHeaders,
          )
          const productId = create.data.product.id

          const res = await api
            .post(
              `/admin/products/${productId}/attributes`,
              { name: "BadAttr" },
              adminHeaders,
            )
            .catch((err) => err.response)
          expect(res.status).toBe(400)
        })
      })

      describe("DELETE /admin/products/:id/attributes/:attribute_id", () => {
        it("removes an inline-created scoped attribute entirely (not just its values)", async () => {
          const create = await api.post(
            `/admin/products`,
            { title: "Delete Inline" },
            adminHeaders,
          )
          const productId = create.data.product.id

          const attach = await api.post(
            `/admin/products/${productId}/attributes`,
            {
              name: "InlineToDelete",
              type: "multi_select",
              values: ["A", "B"],
              is_variant_axis: false,
            },
            adminHeaders,
          )
          expect(attach.status).toBe(201)

          // Sanity: the attribute is present before the delete.
          const before = await api.get(
            `/admin/products/${productId}/attributes`,
            adminHeaders,
          )
          expect(before.data.product_attributes).toHaveLength(1)
          const attributeId = before.data.product_attributes[0].id

          const del = await api.delete(
            `/admin/products/${productId}/attributes/${attributeId}`,
            adminHeaders,
          )
          expect(del.status).toBe(200)
          expect(del.data.deleted).toBe(true)

          // After delete the attribute must be gone — not just its values.
          const after = await api.get(
            `/admin/products/${productId}/attributes`,
            adminHeaders,
          )
          expect(after.data.product_attributes).toEqual([])

          const product = await api.get(
            `/admin/products/${productId}`,
            adminHeaders,
          )
          expect(
            (product.data.product as any).attributes ?? [],
          ).toEqual([])
        })

        it("deletes the matching product option when detaching a variant-axis attribute", async () => {
          // Create product with a variant-axis attribute; the create
          // wrapper synthesises a stock option whose title matches the
          // attribute's name. Detaching the attribute should drop the
          // option in the same call.
          const size = await createGlobalAttribute({
            name: "DetachSize",
            type: "multi_select",
            is_variant_axis: true,
            values: ["S", "M"],
          })

          const create = await api.post(
            `/admin/products`,
            {
              title: "Detach Axis Product",
              variants: [
                { title: "S", attribute_values: { DetachSize: "S" } },
                { title: "M", attribute_values: { DetachSize: "M" } },
              ],
              variant_attributes: [
                {
                  attribute_id: size.attribute_id,
                  value_ids: [size.byName.get("S")!, size.byName.get("M")!],
                },
              ],
            },
            adminHeaders,
          )
          const productId = create.data.product.id
          expect(
            (create.data.product.options ?? []).map((o: any) => o.title),
          ).toContain("DetachSize")

          await api.delete(
            `/admin/products/${productId}/attributes/${size.attribute_id}`,
            adminHeaders,
          )

          const got = await api.get(
            `/admin/products/${productId}`,
            adminHeaders,
          )
          const titles = (got.data.product.options ?? []).map(
            (o: any) => o.title,
          )
          expect(titles).not.toContain("DetachSize")
        })

        it("only detaches links for a global attribute (does not delete the global record)", async () => {
          const color = await createGlobalAttribute({
            name: "GlobalToDetach",
            type: "multi_select",
            is_variant_axis: false,
            values: ["Red"],
          })

          const create = await api.post(
            `/admin/products`,
            {
              title: "Detach Global",
              product_attributes: [
                {
                  attribute_id: color.attribute_id,
                  value_ids: [color.byName.get("Red")!],
                },
              ],
            },
            adminHeaders,
          )
          const productId = create.data.product.id

          const del = await api.delete(
            `/admin/products/${productId}/attributes/${color.attribute_id}`,
            adminHeaders,
          )
          expect(del.status).toBe(200)

          // Gone from the product…
          const after = await api.get(
            `/admin/products/${productId}/attributes`,
            adminHeaders,
          )
          expect(after.data.product_attributes).toEqual([])

          // …but still present in the global catalogue.
          const list = await api.get(`/admin/product-attributes`, adminHeaders)
          const names = (list.data.product_attributes ?? []).map(
            (a: any) => a.name,
          )
          expect(names).toContain("GlobalToDetach")
        })
      })

      describe("POST /admin/products/:id/attributes/batch", () => {
        it("batch-attaches values from multiple attributes in a single call", async () => {
          const color = await createGlobalAttribute({
            name: "BatchColor",
            type: "multi_select",
            is_variant_axis: false,
            values: ["Red", "Blue"],
          })
          const material = await createGlobalAttribute({
            name: "BatchMaterial",
            type: "multi_select",
            is_variant_axis: false,
            values: ["Cotton", "Linen"],
          })

          const create = await api.post(
            `/admin/products`,
            { title: "Batch Create" },
            adminHeaders,
          )
          const productId = create.data.product.id

          const res = await api.post(
            `/admin/products/${productId}/attributes/batch`,
            {
              create: [
                {
                  attribute_id: color.attribute_id,
                  attribute_value_ids: [color.byName.get("Red")!],
                },
                {
                  attribute_id: material.attribute_id,
                  attribute_value_ids: [
                    material.byName.get("Cotton")!,
                    material.byName.get("Linen")!,
                  ],
                },
              ],
            },
            adminHeaders,
          )
          expect(res.status).toBe(200)
          expect(res.data.product.id).toBe(productId)

          const got = await api.get(
            `/admin/products/${productId}/attributes`,
            adminHeaders,
          )
          const byName = new Map<string, any>(
            (got.data.product_attributes as any[]).map((a) => [a.name, a]),
          )
          expect(byName.get("BatchColor")!.values.map((v: any) => v.name)).toEqual([
            "Red",
          ])
          expect(
            byName
              .get("BatchMaterial")!
              .values.map((v: any) => v.name)
              .sort(),
          ).toEqual(["Cotton", "Linen"])
        })

        it("batch-detaches every value belonging to the given attribute ids", async () => {
          const color = await createGlobalAttribute({
            name: "DetachColor",
            type: "multi_select",
            is_variant_axis: false,
            values: ["Red", "Blue"],
          })
          const material = await createGlobalAttribute({
            name: "DetachMaterial",
            type: "multi_select",
            is_variant_axis: false,
            values: ["Cotton"],
          })

          // Seed both attributes via product create.
          const create = await api.post(
            `/admin/products`,
            {
              title: "Batch Delete",
              product_attributes: [
                {
                  attribute_id: color.attribute_id,
                  value_ids: [
                    color.byName.get("Red")!,
                    color.byName.get("Blue")!,
                  ],
                },
                {
                  attribute_id: material.attribute_id,
                  value_ids: [material.byName.get("Cotton")!],
                },
              ],
            },
            adminHeaders,
          )
          const productId = create.data.product.id

          const res = await api.post(
            `/admin/products/${productId}/attributes/batch`,
            { delete: [color.attribute_id] },
            adminHeaders,
          )
          expect(res.status).toBe(200)

          const got = await api.get(
            `/admin/products/${productId}/attributes`,
            adminHeaders,
          )
          expect(got.data.product_attributes).toHaveLength(1)
          expect(got.data.product_attributes[0].name).toBe("DetachMaterial")
        })

        it("combines create + delete in a single batch call", async () => {
          const color = await createGlobalAttribute({
            name: "ComboColor",
            type: "multi_select",
            is_variant_axis: false,
            values: ["Red", "Blue"],
          })
          const material = await createGlobalAttribute({
            name: "ComboMaterial",
            type: "multi_select",
            is_variant_axis: false,
            values: ["Cotton"],
          })

          const create = await api.post(
            `/admin/products`,
            {
              title: "Batch Combined",
              product_attributes: [
                {
                  attribute_id: color.attribute_id,
                  value_ids: [color.byName.get("Red")!],
                },
              ],
            },
            adminHeaders,
          )
          const productId = create.data.product.id

          const res = await api.post(
            `/admin/products/${productId}/attributes/batch`,
            {
              delete: [color.attribute_id],
              create: [
                {
                  attribute_id: material.attribute_id,
                  attribute_value_ids: [material.byName.get("Cotton")!],
                },
              ],
            },
            adminHeaders,
          )
          expect(res.status).toBe(200)

          const got = await api.get(
            `/admin/products/${productId}/attributes`,
            adminHeaders,
          )
          expect(got.data.product_attributes).toHaveLength(1)
          expect(got.data.product_attributes[0].name).toBe("ComboMaterial")
        })

        it("accepts an empty body and returns the product unchanged", async () => {
          const create = await api.post(
            `/admin/products`,
            { title: "Batch Empty" },
            adminHeaders,
          )
          const productId = create.data.product.id

          const res = await api.post(
            `/admin/products/${productId}/attributes/batch`,
            {},
            adminHeaders,
          )
          expect(res.status).toBe(200)
          expect(res.data.product.id).toBe(productId)
        })

        // Variant-axis attribute attach must also synthesise a matching
        // stock product option — same contract as the single-attach
        // endpoint (`POST /:id/attributes`).
        it("batch-attaches a variant-axis attribute and synthesises a matching product option", async () => {
          const size = await createGlobalAttribute({
            name: "BatchAxisSize",
            type: "multi_select",
            is_variant_axis: true,
            values: ["S", "M", "L"],
          })

          const create = await api.post(
            `/admin/products`,
            { title: "Batch Axis Create" },
            adminHeaders,
          )
          const productId = create.data.product.id

          const res = await api.post(
            `/admin/products/${productId}/attributes/batch`,
            {
              create: [
                {
                  attribute_id: size.attribute_id,
                  attribute_value_ids: [
                    size.byName.get("S")!,
                    size.byName.get("M")!,
                  ],
                },
              ],
            },
            adminHeaders,
          )
          expect(res.status).toBe(200)

          const variantsBefore = create.data.product.variants ?? []
          const got = await api.get(
            `/admin/products/${productId}`,
            adminHeaders,
          )
          const option = (got.data.product.options ?? []).find(
            (o: any) => o.title === "BatchAxisSize",
          )
          expect(option).toBeDefined()
          expect(option.values.map((v: any) => v.value).sort()).toEqual([
            "M",
            "S",
          ])

          // Attaching axis option values must NOT regenerate or upsert
          // variants — only the product option set is touched. Variants
          // remain the responsibility of the variant-edit pathway.
          const variantsAfter = got.data.product.variants ?? []
          expect(variantsAfter.map((v: any) => v.id).sort()).toEqual(
            variantsBefore.map((v: any) => v.id).sort(),
          )
        })

        // Symmetric to the single-detach endpoint: detaching a variant-axis
        // attribute via batch drops the matching stock product option too.
        it("batch-detach of a variant-axis attribute also drops the matching product option", async () => {
          const size = await createGlobalAttribute({
            name: "BatchAxisDetach",
            type: "multi_select",
            is_variant_axis: true,
            values: ["S", "M"],
          })

          const create = await api.post(
            `/admin/products`,
            {
              title: "Batch Axis Detach",
              variants: [
                { title: "S", attribute_values: { BatchAxisDetach: "S" } },
                { title: "M", attribute_values: { BatchAxisDetach: "M" } },
              ],
              variant_attributes: [
                {
                  attribute_id: size.attribute_id,
                  value_ids: [
                    size.byName.get("S")!,
                    size.byName.get("M")!,
                  ],
                },
              ],
            },
            adminHeaders,
          )
          const productId = create.data.product.id
          expect(
            (create.data.product.options ?? []).map((o: any) => o.title),
          ).toContain("BatchAxisDetach")

          await api.post(
            `/admin/products/${productId}/attributes/batch`,
            { delete: [size.attribute_id] },
            adminHeaders,
          )

          const got = await api.get(
            `/admin/products/${productId}`,
            adminHeaders,
          )
          const titles = (got.data.product.options ?? []).map(
            (o: any) => o.title,
          )
          expect(titles).not.toContain("BatchAxisDetach")
        })

        // For non-select attribute types the UI sends free-text names via
        // `values: string[]`. Unknown names must be upserted on the fly
        // so the panel doesn't silently no-op when the user types a value
        // that isn't already in the attribute's predefined set.
        it("upserts free-form unit values when the typed name doesn't exist yet", async () => {
          const weight = await createGlobalAttribute({
            name: "FreeFormWeight",
            type: "unit",
            is_variant_axis: false,
            values: [],
          })

          const create = await api.post(
            `/admin/products`,
            { title: "Free-form Unit Attach" },
            adminHeaders,
          )
          const productId = create.data.product.id

          const res = await api.post(
            `/admin/products/${productId}/attributes/batch`,
            {
              create: [
                {
                  attribute_id: weight.attribute_id,
                  values: ["123123"],
                },
              ],
            },
            adminHeaders,
          )
          expect(res.status).toBe(200)

          const got = await api.get(
            `/admin/products/${productId}/attributes`,
            adminHeaders,
          )
          expect(got.data.product_attributes).toHaveLength(1)
          const attr = got.data.product_attributes[0]
          expect(attr.id).toBe(weight.attribute_id)
          expect(attr.type).toBe("unit")
          expect(attr.values.map((v: any) => v.name)).toEqual(["123123"])
        })

        // Unit-type attributes go through the `values: string[]` branch of
        // the batch payload — the workflow resolves the names to existing
        // ProductAttributeValue ids on (attribute_id, name) before linking.
        it("attaches an existing unit-type attribute by value names", async () => {
          const weight = await createGlobalAttribute({
            name: "BatchWeight",
            type: "unit",
            is_variant_axis: false,
            values: ["10 kg", "20 kg", "30 kg"],
          })

          const create = await api.post(
            `/admin/products`,
            { title: "Batch Unit Attach" },
            adminHeaders,
          )
          const productId = create.data.product.id

          const res = await api.post(
            `/admin/products/${productId}/attributes/batch`,
            {
              create: [
                {
                  attribute_id: weight.attribute_id,
                  values: ["10 kg", "20 kg"],
                },
              ],
            },
            adminHeaders,
          )
          expect(res.status).toBe(200)
          expect(res.data.product.id).toBe(productId)

          const got = await api.get(
            `/admin/products/${productId}/attributes`,
            adminHeaders,
          )
          expect(got.data.product_attributes).toHaveLength(1)
          const attr = got.data.product_attributes[0]
          expect(attr.id).toBe(weight.attribute_id)
          expect(attr.name).toBe("BatchWeight")
          expect(attr.type).toBe("unit")
          expect(attr.values.map((v: any) => v.name).sort()).toEqual([
            "10 kg",
            "20 kg",
          ])
        })
      })
    })
  },
})
