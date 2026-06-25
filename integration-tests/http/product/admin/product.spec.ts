import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"

import {
  createProductAttributesWorkflow,
  createProductsWorkflow,
} from "@mercurjs/core/workflows"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(60000)

/**
 * SPEC-014 §G — admin attribute batch endpoint
 * `POST /admin/products/:id/attributes/batch`. Exercises every add/remove/update
 * form over HTTP. Non-axis selections are asserted from the response
 * (`product_attribute_values` / `scoped_attributes`); axis attachment is
 * asserted from the native `ProductOption` side via the container query (the
 * `product.options` populate is broken on the 2.16 preview build).
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - product attributes batch", () => {
      let appContainer: MedusaContainer

      beforeAll(() => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      const createAttr = async (opts: {
        name: string
        type: "multi_select" | "single_select" | "text" | "unit" | "toggle"
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

      const createProduct = async () => {
        const { result } = await createProductsWorkflow(appContainer).run({
          input: {
            products: [{ title: "Batch Product", status: "published" }],
            created_by: "admin_user",
          },
        })
        return (result as { id: string }[])[0].id
      }

      const batch = (productId: string, body: Record<string, unknown>) =>
        api.post(
          `/admin/products/${productId}/attributes/batch`,
          body,
          adminHeaders,
        )

      // Non-axis selected value names from the batch response.
      const valueNames = (product: any) =>
        (product.product_attribute_values ?? [])
          .map((v: any) => v.name)
          .sort()

      // Whether a native ProductOption with `title` is attached to the product.
      // Queried from the ProductOption side because `product.options` populate
      // is broken on the 2.16 options-preview build (MikroORM expandDotPaths).
      const optionAttached = async (productId: string, title: string) => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_option",
          fields: ["id", "title", "products.id"],
          filters: { title },
        })
        return (data ?? []).some(
          (o: any) =>
            o.title === title &&
            (o.products ?? []).some((p: any) => p.id === productId),
        )
      }

      // `is_exclusive` flag of a native ProductOption by title (shared axis →
      // false, inline/scoped axis → true).
      const optionIsExclusive = async (title: string) => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_option",
          fields: ["title", "is_exclusive"],
          filters: { title },
        })
        return data[0]?.is_exclusive
      }

      const scopedAttr = (product: any, name: string) =>
        (product.scoped_attributes ?? []).find((a: any) => a.name === name)

      // Whether a product_attribute row still exists (and its product_id).
      const attributeRow = async (id: string) => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_attribute",
          fields: ["id", "product_id"],
          filters: { id },
        })
        return data[0]
      }

      const getProduct = async (productId: string) =>
        (await api.get(`/admin/products/${productId}`, adminHeaders)).data
          .product

      it("add: existing axis subset + single_select + toggle", async () => {
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
        const productId = await createProduct()

        const res = await batch(productId, {
          add: [
            { id: color.id, value_ids: [color.byName.get("Red")!] },
            { id: material.id, value_ids: [material.byName.get("Cotton")!] },
            { id: waterproof.id, value: true },
          ],
        })

        expect(res.status).toEqual(200)
        // non-axis select + toggle → value links, AND the selected axis subset
        // is linked into the pivot too so the formatter can surface the axis
        // "selected of available" (native options populate is broken on 2.16).
        expect(valueNames(res.data.product)).toEqual(["Cotton", "Red", "true"])
        // axis → native mirror option attached to the product.
        expect(await optionAttached(productId, "Color")).toBe(true)
      })

      it("add: text + unit free-form values", async () => {
        const note = await createAttr({ name: "Note", type: "text" })
        const weight = await createAttr({ name: "Weight", type: "unit" })
        const productId = await createProduct()

        const res = await batch(productId, {
          add: [
            { id: note.id, value: "hand made" },
            { id: weight.id, value: "10kg" },
          ],
        })

        expect(res.status).toEqual(200)
        expect(valueNames(res.data.product)).toEqual(["10kg", "hand made"])
      })

      it("add: inline axis → exclusive option + scoped attribute", async () => {
        const productId = await createProduct()

        const res = await batch(productId, {
          add: [
            { title: "Size", values: ["S", "M", "L"], is_variant_axis: true },
          ],
        })

        expect(res.status).toEqual(200)
        // inline-axis values live on the native exclusive option AND are linked
        // into the product_attribute_value pivot (every exclusive value is
        // selected) so the formatter can surface the axis selection.
        expect(valueNames(res.data.product)).toEqual(["L", "M", "S"])
        // inline → product-scoped attribute surfaced.
        const scoped = (res.data.product.scoped_attributes ?? []).find(
          (a: any) => a.name === "Size",
        )
        expect(scoped).toBeTruthy()
        expect(scoped.is_variant_axis).toBe(true)
        // the inline axis values are created on the product-scoped attribute
        // (the Mercur side of the mirror).
        expect((scoped.values ?? []).map((v: any) => v.name).sort()).toEqual([
          "L",
          "M",
          "S",
        ])
        // exclusive native option attached to the product.
        expect(await optionAttached(productId, "Size")).toBe(true)

        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_option",
          fields: ["title", "is_exclusive", "values.value"],
          filters: { title: "Size" },
        })
        expect(data[0].is_exclusive).toBe(true)
        // ...and the same values are created as the exclusive option's values.
        expect((data[0].values ?? []).map((v: any) => v.value).sort()).toEqual([
          "L",
          "M",
          "S",
        ])
      })

      it("add: inline non-axis (unit) → scoped attribute + value", async () => {
        const productId = await createProduct()

        const res = await batch(productId, {
          add: [{ title: "Net Weight", type: "unit", value: "2kg" }],
        })

        expect(res.status).toEqual(200)
        const scoped = (res.data.product.scoped_attributes ?? []).find(
          (a: any) => a.name === "Net Weight",
        )
        expect(scoped).toBeTruthy()
        expect(valueNames(res.data.product)).toContain("2kg")
      })

      // NOTE: shared-axis update/remove drive Medusa's
      // update/removeProductOptionValuesOnProductStep, which internally read the
      // `product.options.values` populate that is broken on the 2.16 preview
      // build — covered at the engine level but not exercised here.
      it("update: toggle swap + unit swap (non-axis)", async () => {
        const waterproof = await createAttr({
          name: "Waterproof",
          type: "toggle",
        })
        const weight = await createAttr({ name: "Weight", type: "unit" })
        const productId = await createProduct()

        await batch(productId, {
          add: [
            { id: waterproof.id, value: true },
            { id: weight.id, value: "10kg" },
          ],
        })

        const res = await batch(productId, {
          update: [
            { id: waterproof.id, value: false },
            { id: weight.id, value: "11kg" },
          ],
        })

        expect(res.status).toEqual(200)
        // toggle true → false, unit 10kg → 11kg (swap link).
        const names = valueNames(res.data.product)
        expect(names).toContain("false")
        expect(names).toContain("11kg")
        expect(names).not.toContain("true")
        expect(names).not.toContain("10kg")
      })

      it("remove: non-axis dismiss", async () => {
        const material = await createAttr({
          name: "Material",
          type: "single_select",
          values: ["Cotton", "Wool"],
        })
        const productId = await createProduct()

        await batch(productId, {
          add: [
            { id: material.id, value_ids: [material.byName.get("Cotton")!] },
          ],
        })

        const res = await batch(productId, {
          remove: [material.id],
        })

        expect(res.status).toEqual(200)
        expect(valueNames(res.data.product)).toEqual([])
      })

      it("GET enriches product.attributes from the link graph", async () => {
        const material = await createAttr({
          name: "Material",
          type: "single_select",
          values: ["Cotton", "Wool"],
        })
        const productId = await createProduct()
        await batch(productId, {
          add: [{ id: material.id, value_ids: [material.byName.get("Cotton")!] }],
        })

        const res = await api.get(`/admin/products/${productId}`, adminHeaders)
        expect(res.status).toEqual(200)
        const grouped = (res.data.product.attributes ?? []).find(
          (a: any) => a.name === "Material",
        )
        expect(grouped).toBeTruthy()
        // selected value is grouped under its parent attribute.
        expect(grouped.values.map((v: any) => v.name)).toEqual(["Cotton"])
        expect(grouped.type).toBe("single_select")
      })

      // --- POST /admin/products with the unified attributes[] input ---

      it("create: product with every attribute form", async () => {
        const multi = await createAttr({
          name: "Multi Select",
          type: "multi_select",
          is_variant_axis: true,
          values: ["Value 1", "Value 2"],
        })
        const single = await createAttr({
          name: "Single Select",
          type: "single_select",
          values: ["A", "B"],
        })
        const text = await createAttr({ name: "Free Text", type: "text" })
        const toggle = await createAttr({ name: "Flag", type: "toggle" })

        const res = await api.post(
          "/admin/products",
          {
            title: "Created Product",
            status: "published",
            attributes: [
              { id: multi.id, value_ids: [multi.byName.get("Value 1")!] },
              { id: single.id, value_ids: [single.byName.get("A")!] },
              { title: "Size", values: ["S", "M", "L", "XL"], is_variant_axis: true },
              { id: text.id, value: "free text" },
              { title: "Weight", type: "unit", value: "10kg", is_variant_axis: false },
              { id: toggle.id, value: true },
            ],
          },
          adminHeaders,
        )

        expect([200, 201]).toContain(res.status)
        const productId = res.data.product.id

        // non-axis selections (single-select, text, inline unit, toggle) →
        // value links.
        expect(valueNames(res.data.product)).toEqual(
          expect.arrayContaining(["10kg", "A", "free text", "true"]),
        )
        // inline attributes → product-scoped.
        const scopedNames = (res.data.product.scoped_attributes ?? []).map(
          (a: any) => a.name,
        )
        expect(scopedNames).toEqual(expect.arrayContaining(["Size", "Weight"]))
        // axis attributes (existing + inline) → native options attached.
        expect(await optionAttached(productId, "Multi Select")).toBe(true)
        expect(await optionAttached(productId, "Size")).toBe(true)
      })

      // Regression: a variant-axis (multi_select) attribute used to be absent
      // from product.attributes / product_attribute_values because its selected
      // values were never linked into the pivot — only the toggle/text showed up
      // (the reported bug). The axis selection must now surface alongside them.
      it("create: variant-axis attribute surfaces in product.attributes", async () => {
        const axis = await createAttr({
          name: "Required Attribute",
          type: "multi_select",
          is_variant_axis: true,
          values: ["Select 1", "Select 2", "Select 3"],
        })
        const toggle = await createAttr({ name: "Toggle", type: "toggle" })
        const freeText = await createAttr({
          name: "Free Text Attribute",
          type: "text",
        })

        const res = await api.post(
          "/admin/products",
          {
            title: "testmodal",
            status: "published",
            attributes: [
              {
                id: axis.id,
                value_ids: [
                  axis.byName.get("Select 1")!,
                  axis.byName.get("Select 2")!,
                ],
              },
              { id: toggle.id, value: true },
              { id: freeText.id, value: "free test" },
            ],
            variants: [
              { title: "Select 1", options: { "Required Attribute": "Select 1" } },
              { title: "Select 2", options: { "Required Attribute": "Select 2" } },
            ],
          },
          adminHeaders,
        )

        expect([200, 201]).toContain(res.status)
        const productId = res.data.product.id

        // The axis selected subset is linked into the pivot (the fix).
        expect(valueNames(res.data.product)).toEqual(
          expect.arrayContaining(["Select 1", "Select 2", "free test", "true"]),
        )

        // The grouped product.attributes view (GET) includes the axis attribute
        // with exactly its selected values — the missing-attribute regression.
        const product = await getProduct(productId)
        const grouped = (product.attributes ?? []).find(
          (a: any) => a.name === "Required Attribute",
        )
        expect(grouped).toBeTruthy()
        expect(grouped.is_variant_axis).toBe(true)
        expect(grouped.values.map((v: any) => v.name).sort()).toEqual([
          "Select 1",
          "Select 2",
        ])
        // all_values exposes the full catalog value set (selected + available)
        // so the edit form can render the dropdown — backfilled for global
        // attributes whose 2-hop populate resolves empty.
        expect(grouped.all_values.map((v: any) => v.name).sort()).toEqual([
          "Select 1",
          "Select 2",
          "Select 3",
        ])
        // ...and the non-axis attributes are still present.
        const names = (product.attributes ?? []).map((a: any) => a.name)
        expect(names).toEqual(
          expect.arrayContaining([
            "Required Attribute",
            "Toggle",
            "Free Text Attribute",
          ]),
        )
        // Free-form (text) and toggle attributes must NOT be backfilled with an
        // all_values catalog — their values are not a pickable set.
        const freeTextGrouped = (product.attributes ?? []).find(
          (a: any) => a.name === "Free Text Attribute",
        )
        expect(freeTextGrouped.all_values).toEqual([])
        const toggleGrouped = (product.attributes ?? []).find(
          (a: any) => a.name === "Toggle",
        )
        expect(toggleGrouped.all_values).toEqual([])
        // axis still produces the native option.
        expect(await optionAttached(productId, "Required Attribute")).toBe(true)
        // ...and no internal "__default__" placeholder was left behind — the axis
        // option is the product's only option, so variant edits aren't inflated by
        // a dead default (SPEC-014).
        expect(await optionAttached(productId, "__default__")).toBe(false)
      })

      it("create: no __default__ placeholder when product has an axis; seeded otherwise", async () => {
        // Axis product (existing axis ref) → axis option is the only option.
        const axis = await createAttr({
          name: "Axis Attr",
          type: "multi_select",
          is_variant_axis: true,
          values: ["A", "B"],
        })
        const axisRes = await api.post(
          "/admin/products",
          {
            title: "Axis Create Product",
            status: "published",
            attributes: [{ id: axis.id, value_ids: [axis.byName.get("A")!] }],
          },
          adminHeaders,
        )
        expect([200, 201]).toContain(axisRes.status)
        const axisProductId = axisRes.data.product.id
        expect(await optionAttached(axisProductId, "Axis Attr")).toBe(true)
        expect(await optionAttached(axisProductId, "__default__")).toBe(false)

        // Inline axis → also no __default__ placeholder.
        const inlineRes = await api.post(
          "/admin/products",
          {
            title: "Inline Axis Create Product",
            status: "published",
            attributes: [
              { title: "Size", values: ["S", "M"], is_variant_axis: true },
            ],
          },
          adminHeaders,
        )
        expect([200, 201]).toContain(inlineRes.status)
        const inlineProductId = inlineRes.data.product.id
        expect(await optionAttached(inlineProductId, "Size")).toBe(true)
        expect(await optionAttached(inlineProductId, "__default__")).toBe(
          false,
        )

        // No axis (bare product, no UI synthetic axis) → the internal
        // "__default__" placeholder is kept so the product has at least one option.
        const bareRes = await api.post(
          "/admin/products",
          { title: "Bare Create Product", status: "published" },
          adminHeaders,
        )
        expect([200, 201]).toContain(bareRes.status)
        const bareProductId = bareRes.data.product.id
        expect(await optionAttached(bareProductId, "__default__")).toBe(true)
      })

      it("create: no-axis product seeds a Default Option axis (UI contract)", async () => {
        // What the create form now submits when the user defines no variant axis:
        // a synthetic inline "Default Option" axis + a variant bound to it.
        const res = await api.post(
          "/admin/products",
          {
            title: "Simple Product",
            status: "published",
            attributes: [
              { title: "Default Option", values: ["Default"], is_variant_axis: true },
            ],
            variants: [
              { title: "Default variant", options: { "Default Option": "Default" } },
            ],
          },
          adminHeaders,
        )
        expect([200, 201]).toContain(res.status)
        const productId = res.data.product.id

        expect(await optionAttached(productId, "Default Option")).toBe(true)
        // the transient scaffolding is gone once the real option exists.
        expect(await optionAttached(productId, "__default__")).toBe(false)

        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_variant",
          fields: ["title"],
          filters: { product_id: productId },
        })
        expect(data.some((v: any) => v.title === "Default variant")).toBe(true)
      })

      it("create: variants bind to axis options by value name", async () => {
        const multi = await createAttr({
          name: "Multi Select",
          type: "multi_select",
          is_variant_axis: true,
          values: ["Value 1", "Value 2"],
        })

        const res = await api.post(
          "/admin/products",
          {
            title: "Variant Product",
            status: "published",
            attributes: [
              {
                id: multi.id,
                value_ids: [
                  multi.byName.get("Value 1")!,
                  multi.byName.get("Value 2")!,
                ],
              },
              { title: "Size", values: ["S", "M"], is_variant_axis: true },
            ],
            variants: [
              {
                title: "default variant",
                // options keyed by axis attribute title → value NAME.
                options: { Size: "S", "Multi Select": "Value 1" },
              },
            ],
          },
          adminHeaders,
        )

        expect([200, 201]).toContain(res.status)
        const productId = res.data.product.id

        expect(await optionAttached(productId, "Multi Select")).toBe(true)
        expect(await optionAttached(productId, "Size")).toBe(true)

        // the variant was created and bound to the axis option values.
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_variant",
          fields: ["id", "title"],
          filters: { product_id: productId },
        })
        expect(
          data.some((v: any) => v.title === "default variant"),
        ).toBe(true)
      })

      // --- SPEC-014 full attribute-kind matrix (happy path, every kind in one
      // call → 200 → linked → GET surfaces it) ---

      it("add: full attribute matrix in one batch links every kind (200)", async () => {
        const multi = await createAttr({
          name: "Multi Select",
          type: "multi_select",
          is_variant_axis: true,
          values: ["Value 1", "Value 2"],
        })
        const single = await createAttr({
          name: "Single Select",
          type: "single_select",
          values: ["Cotton", "Wool"],
        })
        const text = await createAttr({ name: "Free Text", type: "text" })
        const toggle = await createAttr({ name: "Flag", type: "toggle" })
        const productId = await createProduct()

        const res = await batch(productId, {
          add: [
            { id: multi.id, value_ids: [multi.byName.get("Value 1")!] },
            { id: single.id, value_ids: [single.byName.get("Cotton")!] },
            { title: "Size", values: ["S", "M", "L", "XL"], is_variant_axis: true },
            { id: text.id, value: "free text" },
            { title: "Weight", type: "unit", value: "10kg", is_variant_axis: false },
            { id: toggle.id, value: true },
          ],
        })

        expect(res.status).toEqual(200)
        const product = res.data.product

        // non-axis (single-select, text, inline unit, toggle) → value links.
        expect(valueNames(product)).toEqual(
          expect.arrayContaining(["10kg", "Cotton", "free text", "true"]),
        )
        // existing axis multi-select → SHARED native option (is_exclusive:false).
        expect(await optionAttached(productId, "Multi Select")).toBe(true)
        expect(await optionIsExclusive("Multi Select")).toBe(false)
        // inline axis → EXCLUSIVE native option + product-scoped attribute.
        expect(await optionAttached(productId, "Size")).toBe(true)
        expect(await optionIsExclusive("Size")).toBe(true)
        const size = scopedAttr(product, "Size")
        expect(size?.is_variant_axis).toBe(true)
        expect((await attributeRow(size.id)).product_id).toBe(productId)
        // inline unit → product-scoped attribute.
        expect(scopedAttr(product, "Weight")).toBeTruthy()
      })

      it("GET product surfaces product_attribute_values + scoped_attributes after batch add", async () => {
        const single = await createAttr({
          name: "Single Select",
          type: "single_select",
          values: ["Cotton", "Wool"],
        })
        const text = await createAttr({ name: "Free Text", type: "text" })
        const productId = await createProduct()

        await batch(productId, {
          add: [
            { id: single.id, value_ids: [single.byName.get("Cotton")!] },
            { id: text.id, value: "free text" },
            { title: "Weight", type: "unit", value: "10kg", is_variant_axis: false },
          ],
        })

        const product = await getProduct(productId)
        // selected non-axis values surface, each carrying its parent attribute.
        expect(valueNames(product)).toEqual(
          expect.arrayContaining(["10kg", "Cotton", "free text"]),
        )
        const cotton = (product.product_attribute_values ?? []).find(
          (v: any) => v.name === "Cotton",
        )
        expect(cotton?.attribute?.name).toBe("Single Select")
        // inline unit → product-scoped.
        expect(scopedAttr(product, "Weight")).toBeTruthy()
      })

      it("update: inline scoped text value upsert (200)", async () => {
        const productId = await createProduct()
        // seed an inline product-scoped text attribute.
        const added = await batch(productId, {
          add: [{ title: "Care", type: "text", value: "wash cold" }],
        })
        const careId = scopedAttr(added.data.product, "Care").id

        const res = await batch(productId, {
          update: [{ id: careId, value: "wash warm" }],
        })

        expect(res.status).toEqual(200)
        const names = valueNames(res.data.product)
        expect(names).toContain("wash warm")
        expect(names).not.toContain("wash cold")
      })

      // The grouped `product.attributes` flags product-scoped (inline)
      // attributes via `is_scoped` so the dashboard edit form can offer the
      // create-style inputs (editable title) only for them.
      it("GET: scoped attributes carry is_scoped:true (catalog ones false)", async () => {
        const productId = await createProduct()
        const single = await createAttr({
          name: "Material",
          type: "single_select",
          values: ["Cotton", "Wool"],
        })
        const cottonId = single.byName.get("Cotton")!
        await batch(productId, {
          add: [
            { title: "Care", type: "text", value: "wash cold" },
            { id: single.id, value_ids: [cottonId] },
          ],
        })

        const res = await api.get(
          `/admin/products/${productId}`,
          adminHeaders,
        )
        const attrs = res.data.product.attributes ?? []
        const care = attrs.find((a: any) => a.name === "Care")
        const material = attrs.find((a: any) => a.name === "Material")
        expect(care?.is_scoped).toBe(true)
        expect(material?.is_scoped).toBe(false)
      })

      it("update: rename a scoped text attribute (200)", async () => {
        const productId = await createProduct()
        const added = await batch(productId, {
          add: [{ title: "Care", type: "text", value: "wash cold" }],
        })
        const careId = scopedAttr(added.data.product, "Care").id

        const res = await batch(productId, {
          update: [{ id: careId, title: "Care Instructions", value: "wash warm" }],
        })

        expect(res.status).toEqual(200)
        expect(scopedAttr(res.data.product, "Care Instructions")).toBeTruthy()
        expect(scopedAttr(res.data.product, "Care")).toBeFalsy()
        expect(valueNames(res.data.product)).toContain("wash warm")
      })

      it("update: rename a scoped axis attribute + add a value (200)", async () => {
        const productId = await createProduct()
        const added = await batch(productId, {
          add: [{ title: "Size", values: ["S", "M"], is_variant_axis: true }],
        })
        const sizeId = scopedAttr(added.data.product, "Size").id

        const res = await batch(productId, {
          update: [{ id: sizeId, title: "Sizing", add: [{ value: "L" }] }],
        })

        expect(res.status).toEqual(200)
        const renamed = scopedAttr(res.data.product, "Sizing")
        expect(renamed).toBeTruthy()
        expect((renamed.values ?? []).map((v: any) => v.name).sort()).toEqual([
          "L",
          "M",
          "S",
        ])
        // mirror option title follows the rename.
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_option",
          fields: ["title"],
          filters: { title: "Sizing" },
        })
        expect(data.length).toBe(1)
      })

      it("remove: inline non-axis scoped attribute delete drops scoped attr + value (200)", async () => {
        const productId = await createProduct()
        const added = await batch(productId, {
          add: [
            { title: "Weight", type: "unit", value: "10kg", is_variant_axis: false },
          ],
        })
        const weightId = scopedAttr(added.data.product, "Weight").id
        expect(valueNames(added.data.product)).toContain("10kg")

        const res = await batch(productId, { remove: [weightId] })

        expect(res.status).toEqual(200)
        // scoped attribute deleted + its value link gone.
        expect(await attributeRow(weightId)).toBeFalsy()
        expect(valueNames(res.data.product)).not.toContain("10kg")
      })

      // Blocked by the 2.16 options-preview `product.options(.values)` populate
      // bug (MikroORM expandDotPaths): Medusa's
      // update/removeProductOptionValuesOnProductStep read that populate for
      // compensation, so shared-axis subset edits and shared-axis unlink can't be
      // verified over HTTP yet. The inline/exclusive-axis remove additionally hits
      // "Cannot delete product options that are associated with products" because
      // detaching the option before delete needs that same broken step. Engine-level
      // coverage lives in product-attribute/admin/batch-engine.spec.ts. Re-enable
      // when the populate bug is fixed (memory: product-options-populate-broken-216).
      it.skip("update: shared-axis value subset add/remove", async () => {})

      // The exclusive (product-scoped) axis value delete now works over HTTP:
      // the option-value association is detached via the product service before
      // the option re-sync, sidestepping the broken `*OnProductStep` populate.
      // This is the user-reported reproduction (batch `update[].remove` on a
      // scoped axis was a silent no-op).
      it("update: exclusive option value remove drops the scoped value (200)", async () => {
        const productId = await createProduct()
        const added = await batch(productId, {
          add: [
            { title: "Size", values: ["S", "M", "L"], is_variant_axis: true },
          ],
        })
        const scoped = scopedAttr(added.data.product, "Size")
        const sValueId = (scoped.values ?? []).find(
          (v: any) => v.name === "S",
        ).id

        const res = await batch(productId, {
          update: [{ id: scoped.id, remove: [sValueId] }],
        })

        expect(res.status).toEqual(200)
        // value gone from both the scoped attribute and the selected pivot.
        const updatedScoped = scopedAttr(res.data.product, "Size")
        expect((updatedScoped.values ?? []).map((v: any) => v.name).sort()).toEqual(
          ["L", "M"],
        )
        expect(valueNames(res.data.product)).not.toContain("S")
        // mirrored exclusive option value set re-synced to the remainder.
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_option",
          fields: ["title", "values.value"],
          filters: { title: "Size" },
        })
        expect((data[0].values ?? []).map((v: any) => v.value).sort()).toEqual([
          "L",
          "M",
        ])
      })

      it.skip("update: exclusive option value mutation (add XXL / remove S,M,L)", async () => {})
      it.skip("remove: shared-axis global unlinks product↔option", async () => {})
      it.skip("remove: inline/exclusive scoped axis delete (option still associated)", async () => {})

      it("GET created product surfaces all linked attribute kinds", async () => {
        const multi = await createAttr({
          name: "Multi Select",
          type: "multi_select",
          is_variant_axis: true,
          values: ["Value 1", "Value 2"],
        })
        const single = await createAttr({
          name: "Single Select",
          type: "single_select",
          values: ["A", "B"],
        })
        const text = await createAttr({ name: "Free Text", type: "text" })
        const toggle = await createAttr({ name: "Flag", type: "toggle" })

        const created = await api.post(
          "/admin/products",
          {
            title: "Created Product",
            status: "published",
            attributes: [
              { id: multi.id, value_ids: [multi.byName.get("Value 1")!] },
              { id: single.id, value_ids: [single.byName.get("A")!] },
              { title: "Size", values: ["S", "M", "L", "XL"], is_variant_axis: true },
              { id: text.id, value: "free text" },
              { title: "Weight", type: "unit", value: "10kg", is_variant_axis: false },
              { id: toggle.id, value: true },
            ],
            variants: [
              {
                title: "default variant",
                options: { Size: "S", "Multi Select": "Value 1" },
              },
            ],
          },
          adminHeaders,
        )
        expect([200, 201]).toContain(created.status)
        const productId = created.data.product.id

        const product = await getProduct(productId)
        expect(valueNames(product)).toEqual(
          expect.arrayContaining(["10kg", "A", "free text", "true"]),
        )
        const scopedNames = (product.scoped_attributes ?? []).map(
          (a: any) => a.name,
        )
        expect(scopedNames).toEqual(expect.arrayContaining(["Size", "Weight"]))
        expect(await optionAttached(productId, "Multi Select")).toBe(true)
        expect(await optionAttached(productId, "Size")).toBe(true)
      })
    })
  },
})
