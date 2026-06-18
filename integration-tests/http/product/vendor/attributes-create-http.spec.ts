import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"

import { createSellerUser } from "../../../helpers/create-seller-user"
import { adminHeaders, createAdminUser } from "../../../helpers/create-admin-user"

jest.setTimeout(60 * 1000)

/**
 * SPEC-014 §H: the vendor create route accepts the unified `attributes[]`
 * shape and drives the native-option create path end-to-end over HTTP. Also
 * exercises the rewritten query-config (explicit fields, no `*` wildcards) so
 * the 201 response serializes on the 2.16 preview.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("POST /vendor/products with attributes[]", () => {
      let container: MedusaContainer
      let sellerHeaders: { headers: Record<string, string> }

      beforeAll(() => {
        container = getContainer()
      })

      beforeEach(async () => {
        const seller = await createSellerUser(container, {
          email: "v1@test.com",
          name: "Vendor One",
        })
        sellerHeaders = seller.headers
        await createAdminUser(dbConnection, adminHeaders, container)
      })

      const createAttr = async (opts: {
        name: string
        type: "multi_select" | "single_select" | "toggle"
        is_variant_axis?: boolean
        values?: string[]
      }) => {
        const created = await api.post(
          `/admin/product-attributes`,
          {
            name: opts.name,
            type: opts.type,
            is_variant_axis: opts.is_variant_axis ?? false,
            values: (opts.values ?? []).map((name, rank) => ({ name, rank })),
          },
          adminHeaders,
        )
        const attr = created.data.product_attribute
        const byName = new Map<string, string>(
          (attr.values ?? []).map((v: { id: string; name: string }) => [
            v.name,
            v.id,
          ]),
        )
        return { id: attr.id as string, byName }
      }

      it("creates a product with axis option + subset + non-axis links (201 serializes)", async () => {
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
        const waterproof = await createAttr({ name: "Waterproof", type: "toggle" })

        const res = await api.post(
          `/vendor/products`,
          {
            title: "Vendor Axis Product",
            attributes: [
              { id: color.id, value_ids: [color.byName.get("Red")!] },
              { id: material.id, value_ids: [material.byName.get("Cotton")!] },
              { id: waterproof.id, value: true },
            ],
            variants: [{ title: "Red", options: { Color: "Red" } }],
          },
          sellerHeaders,
        )

        expect(res.status).toBe(201)
        const product = res.data.product

        // native option present in the serialized response (explicit fields)
        const colorOption = (product.options ?? []).find(
          (o: { title: string }) => o.title === "Color",
        )
        expect(colorOption).toBeTruthy()
        const optionValues = (colorOption.values ?? []).map(
          (v: { value: string }) => v.value,
        )
        expect(optionValues).toContain("Red")
        expect(optionValues).not.toContain("Blue")

        // non-axis selections present as attribute values
        const linkedNames = (product.attribute_values ?? []).map(
          (v: { name: string }) => v.name,
        )
        expect(linkedNames).toContain("Cotton")
        expect(linkedNames).toContain("true")

        // cross-check variant resolution via the graph
        const query = container.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product",
          fields: ["id", "variants.options.value"],
          filters: { id: product.id },
        })
        expect(
          (data[0].variants[0].options ?? []).map(
            (v: { value: string }) => v.value,
          ),
        ).toEqual(["Red"])
      })
    })
  },
})
