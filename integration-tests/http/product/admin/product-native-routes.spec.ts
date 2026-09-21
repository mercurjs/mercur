import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"

import { createProductsWorkflow } from "@mercurjs/core/workflows"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - native product routes Mercur does not override", () => {
      let appContainer: MedusaContainer
      let productId: string
      let variantIds: string[]

      beforeAll(() => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        const { result } = await createProductsWorkflow(appContainer).run({
          input: {
            products: [
              {
                title: "Native Routes Product",
                status: "published",
                variants: [{ title: "V1" }, { title: "V2" }],
              },
            ],
          },
        })
        productId = result[0].id

        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product",
          fields: ["variants.id"],
          filters: { id: productId },
        })
        variantIds = data[0].variants.map((v: { id: string }) => v.id)
      })

      it("POST /admin/products/:id/variants/batch deletes a variant", async () => {
        const response = await api.post(
          `/admin/products/${productId}/variants/batch`,
          { delete: [variantIds[0]] },
          adminHeaders
        )

        expect(response.status).toEqual(200)
        expect(response.data.deleted).toEqual(
          expect.objectContaining({ ids: [variantIds[0]], deleted: true })
        )
      })

      it("POST /admin/products/:id/variants/batch rejects unknown fields", async () => {
        const error = await api
          .post(
            `/admin/products/${productId}/variants/batch`,
            { unknown_field: true },
            adminHeaders
          )
          .catch((e) => e)

        expect(error.response.status).toEqual(400)
      })

      it("GET /admin/products/:id/options lists options", async () => {
        const response = await api.get(
          `/admin/products/${productId}/options`,
          adminHeaders
        )

        expect(response.status).toEqual(200)
        expect(response.data.product_options).toEqual(expect.any(Array))
      })

      it("GET /admin/product-variants lists variants", async () => {
        const response = await api.get(`/admin/product-variants`, adminHeaders)

        expect(response.status).toEqual(200)
        expect(response.data.variants).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: variantIds[0] }),
          ])
        )
      })
    })
  },
})
