import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { createProductsWorkflow } from "@mercurjs/core/workflows"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(60000)

let variantsAdditionalData: Record<string, Record<string, unknown>> | null =
  null

createProductsWorkflow.hooks.productsCreated(({ variants_additional_data }) => {
  variantsAdditionalData = variants_additional_data
  return new StepResponse(undefined)
})

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - product create additional_data", () => {
      let appContainer: MedusaContainer

      beforeAll(() => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        variantsAdditionalData = null
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      it("passes per-variant additional_data to productsCreated", async () => {
        const response = await api.post(
          `/admin/products`,
          {
            title: "Admin Extended Product",
            status: "published",
            variants: [
              {
                title: "Default",
                sku: "ADM-EXT-1",
                additional_data: { warranty_months: 12 },
              },
            ],
          },
          adminHeaders
        )
        expect(response.status).toEqual(200)

        const [variant] = response.data.product.variants
        expect(variantsAdditionalData).toEqual({
          [variant.id]: { warranty_months: 12 },
        })
      })

      it("keeps additional_data off the variant batch create route", async () => {
        const created = await api.post(
          `/admin/products`,
          {
            title: "Admin Batch Product",
            status: "published",
            variants: [{ title: "Default", sku: "ADM-BATCH-1" }],
          },
          adminHeaders
        )

        const response = await api
          .post(
            `/admin/products/${created.data.product.id}/variants/batch`,
            {
              create: [
                {
                  title: "Second",
                  sku: "ADM-BATCH-2",
                  additional_data: { warranty_months: 12 },
                },
              ],
            },
            adminHeaders
          )
          .catch((e) => e.response)

        expect(response.status).toEqual(400)
      })
    })
  },
})
