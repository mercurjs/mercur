import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"

import { adminHeaders, createAdminUser } from "../../../helpers/create-admin-user"
import {
  createProductAttributesWorkflow,
  createProductsWorkflow,
} from "@mercurjs/core/workflows"

jest.setTimeout(60 * 1000)

/**
 * SPEC-014 §H: the admin `.../attributes/batch` endpoint drives the batch
 * engine directly (add/remove/update) and the rewritten admin query-config
 * serializes the response on the 2.16 preview.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("POST /admin/products/:id/attributes/batch", () => {
      let container: MedusaContainer

      beforeAll(() => {
        container = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, container)
      })

      const createAttr = async (opts: {
        name: string
        type: "multi_select" | "single_select" | "toggle"
        is_variant_axis?: boolean
        values?: string[]
      }) => {
        const { result } = await createProductAttributesWorkflow(container).run({
          input: {
            attributes: [
              {
                name: opts.name,
                type: opts.type,
                is_variant_axis: opts.is_variant_axis ?? false,
                values: (opts.values ?? []).map((name, rank) => ({ name, rank })),
              },
            ],
          },
        })
        const id = result[0].id
        const query = container.resolve(ContainerRegistrationKeys.QUERY)
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

      it("adds then removes attributes via the batch endpoint (200 serializes)", async () => {
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

        const { result } = await createProductsWorkflow(container).run({
          input: { products: [{ title: "Admin Batch Product", status: "published" }] },
        })
        const productId = (result as { id: string }[])[0].id

        // add via the HTTP batch endpoint
        const addRes = await api.post(
          `/admin/products/${productId}/attributes/batch`,
          {
            add: [
              { id: color.id, value_ids: [color.byName.get("Red")!] },
              { id: material.id, value_ids: [material.byName.get("Cotton")!] },
            ],
          },
          adminHeaders,
        )
        expect(addRes.status).toBe(200)
        const product = addRes.data.product
        const colorOption = (product.options ?? []).find(
          (o: { title: string }) => o.title === "Color",
        )
        expect(colorOption).toBeTruthy()
        expect(
          (colorOption.values ?? []).map((v: { value: string }) => v.value),
        ).toContain("Red")
        expect(
          (product.attribute_values ?? []).map((v: { name: string }) => v.name),
        ).toContain("Cotton")

        // remove the non-axis attribute
        const rmRes = await api.post(
          `/admin/products/${productId}/attributes/batch`,
          { remove: [material.id] },
          adminHeaders,
        )
        expect(rmRes.status).toBe(200)
        expect(
          (rmRes.data.product.attribute_values ?? []).map(
            (v: { name: string }) => v.name,
          ),
        ).not.toContain("Cotton")
      })
    })
  },
})
