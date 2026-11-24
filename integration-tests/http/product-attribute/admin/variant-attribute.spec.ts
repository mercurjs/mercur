import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  batchUpdateVariantAttributesWorkflow,
  createProductsWorkflow,
} from "@mercurjs/core/workflows"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(60000)

type Attribute = {
  id: string
  byName: Map<string, string>
}

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    let appContainer: MedusaContainer

    beforeAll(() => {
      appContainer = getContainer()
    })

    beforeEach(async () => {
      await createAdminUser(dbConnection, adminHeaders, appContainer)
    })

    const createAttr = async (body: Record<string, unknown>): Promise<Attribute> => {
      const res = await api.post("/admin/product-attributes", body, adminHeaders)
      expect([200, 201]).toContain(res.status)
      const attr = res.data.product_attribute
      return {
        id: attr.id,
        byName: new Map(
          (attr.values ?? []).map((v: { id: string; name: string }) => [
            v.name,
            v.id,
          ]),
        ),
      }
    }

    const createProductWithVariants = async () => {
      const { result } = await createProductsWorkflow(appContainer).run({
        input: {
          products: [
            {
              title: "Headphones",
              status: "published",
              variants: [{ title: "Black" }, { title: "White" }],
            },
          ],
          created_by: "admin_user",
        },
      })
      const productId = (result as { id: string }[])[0].id
      const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
      const { data } = await query.graph({
        entity: "product",
        fields: ["id", "variants.id", "variants.title"],
        filters: { id: productId },
      })
      const variants = data[0].variants as { id: string; title: string }[]
      return {
        productId,
        a: variants.find((v) => v.title === "Black")!.id,
        b: variants.find((v) => v.title === "White")!.id,
      }
    }

    const batch = (productId: string, variantId: string, body: unknown) =>
      api
        .post(
          `/admin/products/${productId}/variants/${variantId}/attributes/batch`,
          body,
          adminHeaders,
        )
        .catch((e) => e.response)

    const attributesOf = (variant: any) =>
      Object.fromEntries(
        (variant.attributes ?? []).map((a: any) => [a.id, a]),
      ) as Record<string, { values: { id: string; name: string }[]; all_values: { id: string }[] }>

    describe("Admin - attribute catalog scope", () => {
      it("defaults to product scope and persists variant scope", async () => {
        const res = await api.post(
          "/admin/product-attributes",
          { name: "Material", type: "text" },
          adminHeaders,
        )
        expect(res.data.product_attribute.scope).toBe("product")

        const variantRes = await api.post(
          "/admin/product-attributes",
          { name: "Battery capacity", type: "unit", scope: "variant" },
          adminHeaders,
        )
        expect(variantRes.data.product_attribute.scope).toBe("variant")

        const list = await api.get(
          "/admin/product-attributes?scope=variant",
          adminHeaders,
        )
        const ids = list.data.product_attributes.map((a: any) => a.id)
        expect(ids).toContain(variantRes.data.product_attribute.id)
        expect(ids).not.toContain(res.data.product_attribute.id)
      })

      it("rejects a variant-axis attribute with variant scope", async () => {
        const res = await api
          .post(
            "/admin/product-attributes",
            {
              name: "Size",
              type: "multi_select",
              is_variant_axis: true,
              scope: "variant",
              values: [{ name: "S" }],
            },
            adminHeaders,
          )
          .catch((e) => e.response)
        expect(res.status).toBe(400)
      })

      it("keeps scope immutable after creation", async () => {
        const attr = await createAttr({
          name: "Weight class",
          type: "single_select",
          scope: "variant",
          values: [{ name: "Light" }],
        })
        const res = await api
          .post(
            `/admin/product-attributes/${attr.id}`,
            { scope: "product" },
            adminHeaders,
          )
          .catch((e) => e.response)
        expect(res.status).toBe(400)
      })
    })

    describe("Admin - variant attributes batch", () => {
      it("attaches values to one variant only and exposes them on variant and product reads", async () => {
        const finish = await createAttr({
          name: "Finish",
          type: "single_select",
          scope: "variant",
          values: [{ name: "Matte" }, { name: "Glossy" }],
        })
        const battery = await createAttr({
          name: "Battery capacity",
          type: "unit",
          scope: "variant",
        })
        const { productId, a, b } = await createProductWithVariants()

        const res = await batch(productId, a, {
          add: [
            { id: finish.id, value_ids: [finish.byName.get("Matte")!] },
            { id: battery.id, value: "4000" },
          ],
        })
        expect(res.status).toBe(200)
        const attrs = attributesOf(res.data.variant)
        expect(attrs[finish.id].values.map((v) => v.id)).toEqual([
          finish.byName.get("Matte"),
        ])
        expect(attrs[finish.id].all_values).toHaveLength(2)
        expect(attrs[battery.id].values[0].name).toBe("4000")

        const detailA = await api.get(
          `/admin/products/${productId}/variants/${a}`,
          adminHeaders,
        )
        expect(Object.keys(attributesOf(detailA.data.variant)).sort()).toEqual(
          [finish.id, battery.id].sort(),
        )

        const detailB = await api.get(
          `/admin/products/${productId}/variants/${b}`,
          adminHeaders,
        )
        expect(detailB.data.variant.attributes).toEqual([])

        const product = await api.get(`/admin/products/${productId}`, adminHeaders)
        const variantA = product.data.product.variants.find((v: any) => v.id === a)
        const variantB = product.data.product.variants.find((v: any) => v.id === b)
        expect(variantA.attributes).toHaveLength(2)
        expect(variantB.attributes).toEqual([])
      })

      it("updates select, toggle and scalar values in place and removes attributes", async () => {
        const finish = await createAttr({
          name: "Finish",
          type: "multi_select",
          scope: "variant",
          values: [{ name: "Matte" }, { name: "Glossy" }, { name: "Satin" }],
        })
        const wireless = await createAttr({
          name: "Wireless",
          type: "toggle",
          scope: "variant",
        })
        const battery = await createAttr({
          name: "Battery capacity",
          type: "unit",
          scope: "variant",
        })
        const { productId, a } = await createProductWithVariants()

        await batch(productId, a, {
          add: [
            { id: finish.id, value_ids: [finish.byName.get("Matte")!] },
            { id: wireless.id, value: true },
            { id: battery.id, value: "4000" },
          ],
        })

        const updated = await batch(productId, a, {
          update: [
            {
              id: finish.id,
              add: [finish.byName.get("Glossy")!],
              remove: [finish.byName.get("Matte")!],
            },
            { id: wireless.id, value: false },
            { id: battery.id, value: "5000" },
          ],
        })
        expect(updated.status).toBe(200)
        const attrs = attributesOf(updated.data.variant)
        expect(attrs[finish.id].values.map((v) => v.id)).toEqual([
          finish.byName.get("Glossy"),
        ])
        expect(attrs[wireless.id].values[0].name).toBe("false")
        expect(attrs[battery.id].values).toHaveLength(1)
        expect(attrs[battery.id].values[0].name).toBe("5000")

        const replaced = await batch(productId, a, {
          update: [
            {
              id: finish.id,
              value_ids: [finish.byName.get("Matte")!, finish.byName.get("Satin")!],
            },
          ],
        })
        expect(
          attributesOf(replaced.data.variant)[finish.id].values
            .map((v) => v.id)
            .sort(),
        ).toEqual([finish.byName.get("Matte"), finish.byName.get("Satin")].sort())

        const removed = await batch(productId, a, {
          remove: [finish.id, battery.id],
        })
        expect(removed.status).toBe(200)
        expect(Object.keys(attributesOf(removed.data.variant))).toEqual([
          wireless.id,
        ])

        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data: orphanRows } = await query.graph({
          entity: "product_attribute_value",
          fields: ["id"],
          filters: { attribute_id: battery.id },
        })
        expect(orphanRows).toHaveLength(0)
      })

      it("rejects product-scoped attributes on a variant and variant-scoped ones on a product", async () => {
        const productLevel = await createAttr({
          name: "Material",
          type: "text",
        })
        const variantLevel = await createAttr({
          name: "Battery capacity",
          type: "unit",
          scope: "variant",
        })
        const { productId, a } = await createProductWithVariants()

        const onVariant = await batch(productId, a, {
          add: [{ id: productLevel.id, value: "Steel" }],
        })
        expect(onVariant.status).toBe(400)
        expect(onVariant.data.message).toContain("Material")

        const onProduct = await api
          .post(
            `/admin/products/${productId}/attributes/batch`,
            { add: [{ id: variantLevel.id, value: "4000" }] },
            adminHeaders,
          )
          .catch((e) => e.response)
        expect(onProduct.status).toBe(400)
        expect(onProduct.data.message).toContain("Battery capacity")

        const inline = await batch(productId, a, {
          add: [{ title: "Ad hoc", type: "text", value: "x" }],
        })
        expect(inline.status).toBe(400)
      })

      it("blocks deleting an attribute that is still used on a variant", async () => {
        const battery = await createAttr({
          name: "Battery capacity",
          type: "unit",
          scope: "variant",
        })
        const { productId, a } = await createProductWithVariants()
        await batch(productId, a, { add: [{ id: battery.id, value: "4000" }] })

        const res = await api
          .delete(`/admin/product-attributes/${battery.id}`, adminHeaders)
          .catch((e) => e.response)
        expect(res.status).toBe(400)
      })
    })

    describe("Admin - batch variant attributes across variants", () => {
      const variantAttributes = async (productId: string, variantId: string) => {
        const res = await api.get(
          `/admin/products/${productId}/variants/${variantId}`,
          adminHeaders,
        )
        return attributesOf(res.data.variant)
      }

      it("writes every variant's values in one run and keeps them apart", async () => {
        const finish = await createAttr({
          name: "Finish",
          type: "single_select",
          scope: "variant",
          values: [{ name: "Matte" }, { name: "Glossy" }],
        })
        const wireless = await createAttr({
          name: "Wireless",
          type: "toggle",
          scope: "variant",
        })
        const battery = await createAttr({
          name: "Battery capacity",
          type: "unit",
          scope: "variant",
        })
        const { productId, a, b } = await createProductWithVariants()

        await batchUpdateVariantAttributesWorkflow(appContainer).run({
          input: {
            variants: [
              {
                product_id: productId,
                variant_id: a,
                add: [
                  { id: finish.id, value_ids: [finish.byName.get("Matte")!] },
                  { id: wireless.id, value: true },
                  { id: battery.id, value: "4000" },
                ],
              },
              {
                product_id: productId,
                variant_id: b,
                add: [
                  { id: finish.id, value_ids: [finish.byName.get("Glossy")!] },
                  { id: battery.id, value: "5000" },
                ],
              },
            ],
          },
          throwOnError: true,
        })

        const attrsA = await variantAttributes(productId, a)
        expect(Object.keys(attrsA).sort()).toEqual(
          [finish.id, wireless.id, battery.id].sort(),
        )
        expect(attrsA[finish.id].values.map((v) => v.id)).toEqual([
          finish.byName.get("Matte"),
        ])
        expect(attrsA[wireless.id].values[0].name).toBe("true")
        expect(attrsA[battery.id].values[0].name).toBe("4000")

        const attrsB = await variantAttributes(productId, b)
        expect(Object.keys(attrsB).sort()).toEqual([finish.id, battery.id].sort())
        expect(attrsB[finish.id].values.map((v) => v.id)).toEqual([
          finish.byName.get("Glossy"),
        ])
        expect(attrsB[battery.id].values[0].name).toBe("5000")

        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data: batteryRows } = await query.graph({
          entity: "product_attribute_value",
          fields: ["id", "name"],
          filters: { attribute_id: battery.id },
        })
        expect(batteryRows.map((row) => row.name).sort()).toEqual(["4000", "5000"])
      })

      it("updates and removes per variant, matching the single-variant batch", async () => {
        const finish = await createAttr({
          name: "Finish",
          type: "multi_select",
          scope: "variant",
          values: [{ name: "Matte" }, { name: "Glossy" }],
        })
        const battery = await createAttr({
          name: "Battery capacity",
          type: "unit",
          scope: "variant",
        })
        const { productId, a, b } = await createProductWithVariants()
        await batch(productId, a, {
          add: [
            { id: finish.id, value_ids: [finish.byName.get("Matte")!] },
            { id: battery.id, value: "4000" },
          ],
        })
        await batch(productId, b, { add: [{ id: battery.id, value: "4000" }] })

        await batchUpdateVariantAttributesWorkflow(appContainer).run({
          input: {
            variants: [
              {
                product_id: productId,
                variant_id: a,
                update: [
                  {
                    id: finish.id,
                    add: [finish.byName.get("Glossy")!],
                    remove: [finish.byName.get("Matte")!],
                  },
                  { id: battery.id, value: "5000" },
                ],
              },
              { product_id: productId, variant_id: b, remove: [battery.id] },
            ],
          },
          throwOnError: true,
        })

        const attrsA = await variantAttributes(productId, a)
        expect(attrsA[finish.id].values.map((v) => v.id)).toEqual([
          finish.byName.get("Glossy"),
        ])
        expect(attrsA[battery.id].values).toHaveLength(1)
        expect(attrsA[battery.id].values[0].name).toBe("5000")
        expect(await variantAttributes(productId, b)).toEqual({})

        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data: batteryRows } = await query.graph({
          entity: "product_attribute_value",
          fields: ["id", "name"],
          filters: { attribute_id: battery.id },
        })
        expect(batteryRows.map((row) => row.name)).toEqual(["5000"])
      })

      it("writes nothing when one variant's attribute is product-scoped", async () => {
        const material = await createAttr({ name: "Material", type: "text" })
        const battery = await createAttr({
          name: "Battery capacity",
          type: "unit",
          scope: "variant",
        })
        const { productId, a, b } = await createProductWithVariants()

        const { errors } = await batchUpdateVariantAttributesWorkflow(appContainer).run({
          input: {
            variants: [
              { product_id: productId, variant_id: a, add: [{ id: battery.id, value: "4000" }] },
              { product_id: productId, variant_id: b, add: [{ id: material.id, value: "Steel" }] },
            ],
          },
          throwOnError: false,
        })
        expect(errors[0].error.message).toContain("Material")

        expect(await variantAttributes(productId, a)).toEqual({})
        expect(await variantAttributes(productId, b)).toEqual({})
      })
    })
  },
})
