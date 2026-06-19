import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"

import {
  createProductAttributesWorkflow,
  createProductsWorkflow,
} from "@mercurjs/core/workflows"

import { adminHeaders, createAdminUser } from "../../../helpers/create-admin-user"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("DEBUG null links", () => {
      let appContainer: MedusaContainer
      beforeAll(() => {
        appContainer = getContainer()
      })
      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      const mkAttr = async (opts: any) => {
        const { result } = await createProductAttributesWorkflow(
          appContainer,
        ).run({
          input: {
            attributes: [
              {
                name: opts.name,
                type: opts.type,
                is_variant_axis: opts.is_variant_axis ?? false,
                values: (opts.values ?? []).map((name: string, rank: number) => ({
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
          (data[0].values ?? []).map((v: any) => [v.name, v.id]),
        )
        return { id, byName }
      }

      it("dumps product_attribute_values for the inline + axis matrix", async () => {
        const multi = await mkAttr({
          name: "Multi Select",
          type: "multi_select",
          is_variant_axis: true,
          values: ["Value 1", "Value 2", "Value 3"],
        })
        const single = await mkAttr({
          name: "Single Select",
          type: "single_select",
          values: ["A", "B"],
        })

        const created = await api.post(
          "/admin/products",
          {
            title: "Debug Product",
            status: "published",
            attributes: [
              { id: multi.id, value_ids: [multi.byName.get("Value 1")!, multi.byName.get("Value 2")!] },
              { id: single.id, value_ids: [single.byName.get("A")!] },
              { title: "Size", values: ["S", "M", "L"], is_variant_axis: true },
              { title: "Weight", type: "unit", value: "10kg", is_variant_axis: false },
            ],
          },
          adminHeaders,
        )
        const productId = created.data.product.id

        const get = await api.get(`/admin/products/${productId}`, adminHeaders)
        // eslint-disable-next-line no-console
        console.log(
          "PAV=",
          JSON.stringify(get.data.product.product_attribute_values, null, 2),
        )
        // eslint-disable-next-line no-console
        console.log(
          "SCOPED=",
          JSON.stringify(get.data.product.scoped_attributes, null, 2),
        )
        // eslint-disable-next-line no-console
        console.log(
          "ATTRS=",
          JSON.stringify(get.data.product.attributes, null, 2),
        )
        expect(get.status).toBe(200)
      })
    })
  },
})
