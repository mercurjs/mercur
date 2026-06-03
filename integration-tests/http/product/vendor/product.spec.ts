import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { adminHeaders, createAdminUser } from "../../../helpers/create-admin-user"

jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Vendor Products — attribute wrappers (4 cases)", () => {
      let container: MedusaContainer
      let seller1Headers: { headers: Record<string, string> }
      let seller2Headers: { headers: Record<string, string> }

      beforeAll(async () => {
        container = getContainer()
      })

      beforeEach(async () => {
        const a = await createSellerUser(container, {
          email: "v1@test.com",
          name: "Vendor One",
        })
        seller1Headers = a.headers
        const b = await createSellerUser(container, {
          email: "v2@test.com",
          name: "Vendor Two",
        })
        seller2Headers = b.headers
        await createAdminUser(dbConnection, adminHeaders, container)
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

      describe("POST /vendor/products", () => {
        it("creates a simple product (manage_inventory=false on every variant)", async () => {
          const res = await api.post(
            `/vendor/products`,
            { title: "Vendor Product" },
            seller1Headers,
          )
          expect(res.status).toBe(201)
          expect(res.data.product.title).toBe("Vendor Product")
          for (const v of res.data.product.variants ?? []) {
            expect(v.manage_inventory).toBe(false)
          }
        })

        // --- Case A: existing variant-axis attribute ---
        it("(A) existing variant-axis: synthesizes stock options + links the chosen values", async () => {
          const size = await createGlobalAttribute({
            name: "Size",
            type: "multi_select",
            is_variant_axis: true,
            values: ["S", "M", "L"],
          })

          const create = await api.post(
            `/vendor/products`,
            {
              title: "Vendor T-Shirt",
              variants: [
                { title: "Small", attribute_values: { Size: "S" } },
                { title: "Medium", attribute_values: { Size: "M" } },
              ],
              variant_attributes: [
                {
                  attribute_id: size.attribute_id,
                  value_ids: [size.byName.get("S")!, size.byName.get("M")!],
                },
              ],
            },
            seller1Headers,
          )
          expect(create.status).toBe(201)

          const productId = create.data.product.id

          // Synthetic stock options are emitted with the attribute's name + value names.
          const sizeOption = create.data.product.options.find(
            (o: any) => o.title === "Size",
          )
          expect(sizeOption).toBeDefined()
          expect(sizeOption.values.map((v: any) => v.value).sort()).toEqual([
            "M",
            "S",
          ])

          // GET surfaces a unified `attributes` array containing exactly the linked values.
          const got = await api.get(
            `/vendor/products/${productId}`,
            seller1Headers,
          )
          const attrs = got.data.product.attributes
          expect(attrs).toHaveLength(1)
          expect(attrs[0].name).toBe("Size")
          expect(attrs[0].is_variant_axis).toBe(true)
          expect(attrs[0].values.map((v: any) => v.name).sort()).toEqual([
            "M",
            "S",
          ])
          // `all_values` carries the full set so the edit form can render the dropdown.
          expect(attrs[0].all_values.map((v: any) => v.name).sort()).toEqual([
            "L",
            "M",
            "S",
          ])
        })

        // --- Case B: inline custom variant-axis attribute ---
        it("(B) inline custom variant-axis: creates a product-scoped attribute, links values, hides it from the global catalogue", async () => {
          const create = await api.post(
            `/vendor/products`,
            {
              title: "Vendor Custom Axis",
              variants: [
                { title: "Cotton", attribute_values: { Material: "Cotton" } },
                { title: "Wool", attribute_values: { Material: "Wool" } },
              ],
              variant_attributes: [
                {
                  name: "Material",
                  type: "multi_select",
                  values: ["Cotton", "Wool"],
                  is_variant_axis: true,
                },
              ],
            },
            seller1Headers,
          )
          expect(create.status).toBe(201)
          const productId = create.data.product.id

          // Stock options were synthesized from the inline payload.
          const opt = create.data.product.options.find(
            (o: any) => o.title === "Material",
          )
          expect(opt.values.map((v: any) => v.value).sort()).toEqual([
            "Cotton",
            "Wool",
          ])

          const got = await api.get(
            `/vendor/products/${productId}`,
            seller1Headers,
          )
          const attrs = got.data.product.attributes
          expect(attrs).toHaveLength(1)
          expect(attrs[0].name).toBe("Material")
          expect(attrs[0].is_variant_axis).toBe(true)
          expect(attrs[0].values.map((v: any) => v.name).sort()).toEqual([
            "Cotton",
            "Wool",
          ])

          // Inline attribute must NOT appear in the global vendor catalogue.
          const list = await api.get(`/vendor/product-attributes`, seller1Headers)
          const names = (list.data.product_attributes ?? []).map(
            (a: any) => a.name,
          )
          expect(names).not.toContain("Material")
        })

        // --- Case C: existing product (non-axis) attribute ---
        it("(C) existing product-level: links values only, no extra options", async () => {
          const care = await createGlobalAttribute({
            name: "Care",
            type: "multi_select",
            is_variant_axis: false,
            values: ["Hand wash", "Dry clean", "Machine"],
          })

          const create = await api.post(
            `/vendor/products`,
            {
              title: "Vendor Care Product",
              product_attributes: [
                {
                  attribute_id: care.attribute_id,
                  value_ids: [care.byName.get("Hand wash")!],
                },
              ],
            },
            seller1Headers,
          )
          expect(create.status).toBe(201)
          const productId = create.data.product.id

          // No new options should appear from a non-axis attribute.
          const careOption = create.data.product.options.find(
            (o: any) => o.title === "Care",
          )
          expect(careOption).toBeUndefined()

          const got = await api.get(
            `/vendor/products/${productId}`,
            seller1Headers,
          )
          const attrs = got.data.product.attributes
          expect(attrs).toHaveLength(1)
          expect(attrs[0].name).toBe("Care")
          expect(attrs[0].is_variant_axis).toBe(false)
          expect(attrs[0].values.map((v: any) => v.name)).toEqual(["Hand wash"])
          expect(attrs[0].all_values.map((v: any) => v.name).sort()).toEqual([
            "Dry clean",
            "Hand wash",
            "Machine",
          ])
        })

        // --- Case D: inline custom product (non-axis) attribute ---
        it("(D) inline custom product-level: creates a product-scoped attribute + values, hidden from global catalogue", async () => {
          const create = await api.post(
            `/vendor/products`,
            {
              title: "Vendor Inline Care",
              product_attributes: [
                {
                  name: "ShippingNote",
                  type: "text",
                  values: ["Fragile - handle with care"],
                  is_variant_axis: false,
                },
              ],
            },
            seller1Headers,
          )
          expect(create.status).toBe(201)
          const productId = create.data.product.id

          const got = await api.get(
            `/vendor/products/${productId}`,
            seller1Headers,
          )
          const attrs = got.data.product.attributes
          expect(attrs).toHaveLength(1)
          expect(attrs[0].name).toBe("ShippingNote")
          expect(attrs[0].is_variant_axis).toBe(false)
          expect(attrs[0].values.map((v: any) => v.name)).toEqual([
            "Fragile - handle with care",
          ])

          const list = await api.get(`/vendor/product-attributes`, seller1Headers)
          const names = (list.data.product_attributes ?? []).map(
            (a: any) => a.name,
          )
          expect(names).not.toContain("ShippingNote")
        })

        it("mixes existing + inline custom attributes on the same product", async () => {
          const color = await createGlobalAttribute({
            name: "Color",
            type: "multi_select",
            is_variant_axis: true,
            values: ["Red", "Blue"],
          })

          const create = await api.post(
            `/vendor/products`,
            {
              title: "Mixed Attrs",
              variants: [{ title: "Red", attribute_values: { Color: "Red" } }],
              variant_attributes: [
                {
                  attribute_id: color.attribute_id,
                  value_ids: [color.byName.get("Red")!],
                },
              ],
              product_attributes: [
                {
                  name: "Origin",
                  type: "text",
                  values: ["Italy"],
                  is_variant_axis: false,
                },
              ],
            },
            seller1Headers,
          )
          expect(create.status).toBe(201)

          const got = await api.get(
            `/vendor/products/${create.data.product.id}`,
            seller1Headers,
          )
          const attrs = got.data.product.attributes
          const byName = new Map(attrs.map((a: any) => [a.name, a]))
          expect(byName.get("Color")?.values.map((v: any) => v.name)).toEqual([
            "Red",
          ])
          expect(byName.get("Origin")?.values.map((v: any) => v.name)).toEqual([
            "Italy",
          ])
        })
      })

      describe("Vendor product attribute link replacement (via dedicated /attributes endpoints)", () => {
        // The replace-semantics test originally exercised
        // `POST /vendor/products/:id` carrying `variant_attributes`,
        // which the legacy direct-mutation route resolved via the Mercur
        // wrapper of `updateProductsWorkflow`. The new staging contract
        // routes attribute mutations through the dedicated
        // `/vendor/products/:id/attributes` endpoints instead — so the
        // same end state is reached by DELETE-then-POST.
        it("replaces previously-linked values when the update payload changes them", async () => {
          const size = await createGlobalAttribute({
            name: "Size",
            type: "multi_select",
            is_variant_axis: true,
            values: ["S", "M", "L"],
          })

          const create = await api.post(
            `/vendor/products`,
            {
              title: "Updatable",
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
            seller1Headers,
          )
          const productId = create.data.product.id

          await api.delete(
            `/vendor/products/${productId}/attributes/${size.attribute_id}`,
            seller1Headers,
          )
          await api.post(
            `/vendor/products/${productId}/attributes`,
            {
              attribute_id: size.attribute_id,
              attribute_value_ids: [size.byName.get("S")!],
            },
            seller1Headers,
          )

          const got = await api.get(
            `/vendor/products/${productId}`,
            seller1Headers,
          )
          const attrs = got.data.product.attributes
          expect(attrs).toHaveLength(1)
          expect(attrs[0].values.map((v: any) => v.name)).toEqual(["S"])
        })

        // Round-trip: a product first created with an inline-custom
        // attribute should NOT materialise a second ProductAttribute row
        // when the UI re-sends it as an existing reference (i.e. uses the
        // `attribute_id` returned by GET) on subsequent updates.
        it("inline custom round-trip via attribute_id does not materialise duplicate attributes", async () => {
          const create = await api.post(
            `/vendor/products`,
            {
              title: "Round-trip custom",
              variants: [
                { title: "S", attribute_values: { Caliber: "S" } },
                { title: "M", attribute_values: { Caliber: "M" } },
              ],
              variant_attributes: [
                {
                  name: "Caliber",
                  type: "multi_select",
                  values: ["S", "M"],
                  is_variant_axis: true,
                },
              ],
            },
            seller1Headers,
          )
          const productId = create.data.product.id

          const first = await api.get(
            `/vendor/products/${productId}`,
            seller1Headers,
          )
          const inlineAttr = first.data.product.attributes.find(
            (a: any) => a.name === "Caliber",
          )
          expect(inlineAttr).toBeDefined()
          const inlineAttributeId = inlineAttr.id
          const sId = inlineAttr.values.find(
            (v: any) => v.name === "S",
          ).id
          const mId = inlineAttr.values.find(
            (v: any) => v.name === "M",
          ).id

          // Re-send as an existing reference (mirrors what the edit form
          // does after a round-trip) — through the dedicated attributes
          // endpoints. We DELETE the existing link set then re-attach the
          // narrower selection so the final link set is exactly `[S]`.
          await api.delete(
            `/vendor/products/${productId}/attributes/${inlineAttributeId}`,
            seller1Headers,
          )
          await api.post(
            `/vendor/products/${productId}/attributes`,
            {
              attribute_id: inlineAttributeId,
              attribute_value_ids: [sId],
            },
            seller1Headers,
          )

          const second = await api.get(
            `/vendor/products/${productId}`,
            seller1Headers,
          )
          const attrs = second.data.product.attributes
          expect(attrs).toHaveLength(1)
          expect(attrs[0].id).toBe(inlineAttributeId)
          expect(attrs[0].values.map((v: any) => v.name)).toEqual(["S"])
          // `all_values` should still contain both originally-created
          // values — the attribute itself wasn't re-materialised.
          expect(attrs[0].all_values.map((v: any) => v.name).sort()).toEqual([
            "M",
            "S",
          ])
          // Reference for documentation; not used otherwise.
          expect(typeof mId).toBe("string")
        })
      })

      describe("GET /vendor/products", () => {
        it("lists own products and excludes other vendors' unpublished products", async () => {
          // Use `draft` to keep products unpublished. The vendor create
          // flow opens a publish-approval ProductChange that auto-confirms
          // when MEDUSA_FF_PRODUCT_REQUEST is off (the test env), which
          // would otherwise leak the second seller's product into the
          // first seller's master-catalog view.
          await api.post(
            `/vendor/products`,
            { title: "Seller 1 Draft", status: "draft" },
            seller1Headers,
          )
          await api.post(
            `/vendor/products`,
            { title: "Seller 2 Draft", status: "draft" },
            seller2Headers,
          )
          const res = await api.get(`/vendor/products`, seller1Headers)
          expect(res.status).toBe(200)
          const titles = res.data.products.map((p: any) => p.title)
          expect(titles).toContain("Seller 1 Draft")
          expect(titles).not.toContain("Seller 2 Draft")
        })
      })

      describe("POST /vendor/products/:id (title update)", () => {
        it("seller updates own product", async () => {
          const create = await api.post(
            `/vendor/products`,
            { title: "Own" },
            seller1Headers,
          )
          const id = create.data.product.id
          const res = await api.post(
            `/vendor/products/${id}`,
            { title: "Updated" },
            seller1Headers,
          )
          // POST /vendor/products/:id stages a ProductChange and returns 202.
          // The test env has `MEDUSA_FF_PRODUCT_REQUEST=false`, so the change
          // is auto-confirmed and the underlying product is already updated
          // by the time we read it back.
          expect(res.status).toBe(202)
          expect(res.data.product_change).toBeDefined()
          const got = await api.get(`/vendor/products/${id}`, seller1Headers)
          expect(got.data.product.title).toBe("Updated")
        })

        it("seller cannot update another seller's product", async () => {
          const create = await api.post(
            `/vendor/products`,
            { title: "Seller 1 Owned" },
            seller1Headers,
          )
          const id = create.data.product.id
          await expect(
            api.post(
              `/vendor/products/${id}`,
              { title: "hack" },
              seller2Headers,
            ),
          ).rejects.toMatchObject({ response: { status: 404 } })
        })
      })

      describe("POST /vendor/products/:id/attributes (attach existing branch)", () => {
        it("attaches an existing variant-axis attribute and synthesises a matching product option", async () => {
          const size = await createGlobalAttribute({
            name: "AttachSize",
            type: "multi_select",
            is_variant_axis: true,
            values: ["S", "M", "L"],
          })

          const create = await api.post(
            `/vendor/products`,
            { title: "Attach Axis Product" },
            seller1Headers,
          )
          const productId = create.data.product.id

          const res = await api.post(
            `/vendor/products/${productId}/attributes`,
            {
              attribute_id: size.attribute_id,
              attribute_value_ids: [
                size.byName.get("S")!,
                size.byName.get("M")!,
              ],
            },
            seller1Headers,
          )
          // Attribute attach stages an ATTRIBUTE_ADD action; auto-confirm
          // applies it inline because the test env disables the flag.
          expect(res.status).toBe(202)
          expect(res.data.product_change).toBeDefined()

          const got = await api.get(
            `/vendor/products/${productId}`,
            seller1Headers,
          )
          const option = (got.data.product.options ?? []).find(
            (o: any) => o.title === "AttachSize",
          )
          expect(option).toBeDefined()
          expect(option.values.map((v: any) => v.value).sort()).toEqual([
            "M",
            "S",
          ])
        })

        // Free-form values (unit / text / toggle) submitted against an
        // existing attribute don't pre-exist in the attribute's preset
        // `values`. The staging workflow must materialise them so the
        // staged ATTRIBUTE_ADD action carries non-empty
        // `attribute_value_ids` (the dispatcher contract).
        it("materialises free-form values on an existing unit attribute", async () => {
          const weight = await createGlobalAttribute({
            name: "Weight",
            type: "unit",
            values: [],
          })

          const create = await api.post(
            `/vendor/products`,
            { title: "Weighty Product" },
            seller1Headers,
          )
          const productId = create.data.product.id

          const res = await api.post(
            `/vendor/products/${productId}/attributes`,
            {
              attribute_id: weight.attribute_id,
              values: ["10kg"],
            },
            seller1Headers,
          )
          expect(res.status).toBe(202)
          const actions = res.data.product_change?.actions ?? []
          const addActions = actions.filter(
            (a: any) => a.action === "ATTRIBUTE_ADD",
          )
          expect(addActions).toHaveLength(1)
          expect(addActions[0].details.attribute_id).toBe(weight.attribute_id)
          expect(addActions[0].details.attribute_value_ids).toHaveLength(1)

          // The value row is now persisted on the attribute, so the
          // active-edit panel (`useProductAttribute`) can resolve the
          // name from the staged id.
          const got = await api.get(
            `/vendor/product-attributes/${weight.attribute_id}`,
            seller1Headers,
          )
          const names = (got.data.product_attribute.values ?? []).map(
            (v: any) => v.name,
          )
          expect(names).toContain("10kg")
        })

        it("rejects free-form `values` against a select-type attribute when names do not match presets", async () => {
          const color = await createGlobalAttribute({
            name: "Color",
            type: "multi_select",
            values: ["Red", "Blue"],
          })

          const create = await api.post(
            `/vendor/products`,
            { title: "Picky Product" },
            seller1Headers,
          )
          const productId = create.data.product.id

          const res = await api
            .post(
              `/vendor/products/${productId}/attributes`,
              {
                attribute_id: color.attribute_id,
                values: ["Magenta"],
              },
              seller1Headers,
            )
            .catch((e: any) => e.response)
          expect(res.status).toBeGreaterThanOrEqual(400)
          expect(res.status).toBeLessThan(500)
          expect(JSON.stringify(res.data)).toMatch(/Magenta/)
        })
      })

      describe("POST /vendor/products/:id/attributes (inline create branch)", () => {
        it("inline creates a product-scoped non-axis attribute and attaches its values", async () => {
          const create = await api.post(
            `/vendor/products`,
            { title: "Vendor Inline Note" },
            seller1Headers,
          )
          const productId = create.data.product.id

          const res = await api.post(
            `/vendor/products/${productId}/attributes`,
            {
              name: "VendorInlineNote",
              type: "text",
              values: ["Handmade"],
              is_variant_axis: false,
            },
            seller1Headers,
          )
          // Inline-create attribute stages ATTRIBUTE_ADD; auto-confirm
          // applies the link inline.
          expect(res.status).toBe(202)

          const got = await api.get(
            `/vendor/products/${productId}/attributes`,
            seller1Headers,
          )
          expect(got.data.product_attributes).toHaveLength(1)
          expect(got.data.product_attributes[0].name).toBe("VendorInlineNote")

          // Product-scoped — not exposed by the global vendor catalogue.
          const list = await api.get(
            `/vendor/product-attributes`,
            seller1Headers,
          )
          const names = (list.data.product_attributes ?? []).map(
            (a: any) => a.name,
          )
          expect(names).not.toContain("VendorInlineNote")
        })

        it("rejects an inline-create body that is missing `type`", async () => {
          const create = await api.post(
            `/vendor/products`,
            { title: "Vendor Inline Bad" },
            seller1Headers,
          )
          const productId = create.data.product.id

          const res = await api
            .post(
              `/vendor/products/${productId}/attributes`,
              { name: "BadAttr" },
              seller1Headers,
            )
            .catch((err) => err.response)
          expect(res.status).toBe(400)
        })

        it("rejects attaching to another seller's product", async () => {
          const create = await api.post(
            `/vendor/products`,
            { title: "Vendor Two Owned" },
            seller2Headers,
          )
          const productId = create.data.product.id

          const res = await api
            .post(
              `/vendor/products/${productId}/attributes`,
              {
                name: "Foreign",
                type: "text",
                values: ["X"],
              },
              seller1Headers,
            )
            .catch((err) => err.response)
          expect(res.status).toBeGreaterThanOrEqual(400)
        })
      })

      describe("DELETE /vendor/products/:id", () => {
        it("seller deletes own product", async () => {
          const create = await api.post(
            `/vendor/products`,
            { title: "Will Delete" },
            seller1Headers,
          )
          const id = create.data.product.id
          const res = await api.delete(
            `/vendor/products/${id}`,
            seller1Headers,
          )
          // Delete is staged as PRODUCT_DELETE and auto-confirmed.
          expect(res.status).toBe(202)
          expect(res.data.product_change).toBeDefined()
          await expect(
            api.get(`/vendor/products/${id}`, seller1Headers),
          ).rejects.toMatchObject({ response: { status: 404 } })
        })
      })
    })
  },
})
