import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { createProductsWorkflow } from "@mercurjs/core/workflows"

import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(120000)

let createdPayload: {
  product_ids: string[]
  additional_data: Record<string, unknown> | undefined
  variants_additional_data: Record<string, Record<string, unknown>>
} | null = null

createProductsWorkflow.hooks.productsCreated(
  ({ products, additional_data, variants_additional_data }) => {
    createdPayload = {
      product_ids: products.map((p: { id: string }) => p.id),
      additional_data,
      variants_additional_data,
    }
    return new StepResponse(undefined)
  }
)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Vendor - product create additional_data", () => {
      let appContainer: MedusaContainer
      let headers: { headers: Record<string, string> }

      beforeAll(() => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        createdPayload = null
        const seller = await createSellerUser(appContainer, {
          email: "product-ad-seller@test.com",
          name: "Product AD Seller",
        })
        headers = seller.headers
      })

      it("passes product and per-variant additional_data to productsCreated", async () => {
        const response = await api.post(
          `/vendor/products`,
          {
            title: "Extended Tee",
            status: "published",
            attributes: [
              {
                title: "Size",
                type: "multi_select",
                values: ["S", "L"],
                is_variant_axis: true,
              },
            ],
            variants: [
              {
                title: "S",
                sku: "EXT-TEE-S",
                options: { Size: "S" },
                additional_data: { barcode_source: "gs1" },
              },
              { title: "L", sku: "EXT-TEE-L", options: { Size: "L" } },
            ],
            additional_data: { erp_id: "ERP-1" },
          },
          headers
        )
        expect(response.status).toEqual(201)

        const product = response.data.product
        const small = product.variants.find(
          (v: { sku: string }) => v.sku === "EXT-TEE-S"
        )

        expect(createdPayload?.product_ids).toEqual([product.id])
        expect(createdPayload?.additional_data).toEqual({ erp_id: "ERP-1" })
        expect(createdPayload?.variants_additional_data).toEqual({
          [small.id]: { barcode_source: "gs1" },
        })
      })
    })
  },
})
