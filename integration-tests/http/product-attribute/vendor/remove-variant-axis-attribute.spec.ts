import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { IProductModuleService } from "@medusajs/framework/types"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { removeProductAttributesFromProductWorkflow } from "@mercurjs/core/workflows"
import { MercurModules } from "@mercurjs/types"

import { createSellerUser } from "../../../helpers/create-seller-user"
import { createVendorProduct } from "../../../helpers/create-product"

jest.setTimeout(60_000)

/**
 * A product-scoped axis attribute owns an exclusive product option that stays
 * linked to the product, and the option's values back the product's variants.
 * Removing the attribute has to unwind both, otherwise Medusa rejects the
 * option deletion (issue #1422).
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("removeProductAttributesFromProductWorkflow — variant axis", () => {
      let container: MedusaContainer
      let sellerHeaders: { headers: Record<string, string> }

      beforeAll(async () => {
        container = getContainer()
      })

      beforeEach(async () => {
        const seller = await createSellerUser(container, {
          email: "axis-seller@test.com",
          name: "Axis Seller",
        })
        sellerHeaders = seller.headers
      })

      const axisAttributeOf = async (productId: string) => {
        const query = container.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_attribute",
          fields: ["id", "name", "is_variant_axis", "product_option_id"],
          filters: { product_id: productId },
        })
        return (
          data as Array<{
            id: string
            is_variant_axis: boolean
            product_option_id: string | null
          }>
        ).find((a) => a.is_variant_axis)!
      }

      it("removes an inline axis attribute together with its option and variants", async () => {
        const product = await createVendorProduct(api, sellerHeaders, {
          title: "Axis Product",
          attributes: [
            {
              title: "Size",
              type: "multi_select",
              values: ["S", "M"],
              is_variant_axis: true,
            },
          ],
          variants: [
            { title: "S", sku: "axis-s", options: { Size: "S" } },
            { title: "M", sku: "axis-m", options: { Size: "M" } },
          ],
        })

        const attribute = await axisAttributeOf(product.id)
        expect(attribute.product_option_id).toBeTruthy()

        await removeProductAttributesFromProductWorkflow(container).run({
          input: { product_id: product.id, remove: [attribute.id] },
        })

        const productService = container.resolve<IProductModuleService>(
          Modules.PRODUCT
        )
        const variants = await productService.listProductVariants({
          product_id: product.id,
        })
        expect(variants).toHaveLength(0)

        const options = await productService.listProductOptions({
          id: attribute.product_option_id as string,
        })
        expect(options).toHaveLength(0)

        const attributeService: any = container.resolve(
          MercurModules.PRODUCT_ATTRIBUTE
        )
        const attributes = await attributeService.listProductAttributes({
          id: attribute.id,
        })
        expect(attributes).toHaveLength(0)
      })
    })
  },
})
