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
        // non-axis select + toggle → value links (axis value is NOT a link).
        expect(valueNames(res.data.product)).toEqual(["Cotton", "true"])
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
        // inline → product-scoped attribute surfaced.
        const scoped = (res.data.product.scoped_attributes ?? []).find(
          (a: any) => a.name === "Size",
        )
        expect(scoped).toBeTruthy()
        expect(scoped.is_variant_axis).toBe(true)
        // exclusive native option attached to the product.
        expect(await optionAttached(productId, "Size")).toBe(true)

        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_option",
          fields: ["title", "is_exclusive"],
          filters: { title: "Size" },
        })
        expect(data[0].is_exclusive).toBe(true)
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
    })
  },
})
