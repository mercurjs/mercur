import {
  createHook,
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData, LinkDefinition } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  createRemoteLinkStep,
  emitEventStep,
  updateProductsWorkflow as stockUpdateProductsWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { MercurModules } from "@mercurjs/types"

import { linkSellersToProductWorkflow } from "./link-sellers-to-product"

type ProductAttributeInput = {
  attribute_id: string
  value_ids?: string[]
}

export type UpdateProductsWorkflowInput = {
  selector: Record<string, unknown>
  update: Record<string, unknown> & {
    seller_ids?: string[]
    product_attributes?: ProductAttributeInput[]
    variant_attributes?: ProductAttributeInput[]
  }
} & AdditionalData

export const updateProductsWorkflowId = "mercur-update-products"

/**
 * Marketplace wrapper over stock `updateProductsWorkflow`. Strips
 * marketplace-only fields (`seller_ids`, `product_attributes`,
 * `variant_attributes`) from the update payload before delegating to
 * stock, then re-links sellers and attribute values for every product
 * matched by the selector.
 */
export const updateProductsWorkflow = createWorkflow(
  updateProductsWorkflowId,
  function (input: UpdateProductsWorkflowInput) {
    const stockInput = transform({ input }, ({ input }) => {
      const {
        seller_ids: _s,
        product_attributes: _pa,
        variant_attributes: _va,
        ...update
      } = input.update
      return {
        selector: input.selector,
        update,
        additional_data: input.additional_data,
      }
    })

    stockUpdateProductsWorkflow.runAsStep({ input: stockInput as any })

    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: ["id"],
      filters: input.selector,
    }).config({ name: "mercur-update-products-load" })

    // Marketplace: refresh seller links via `product_seller` pivot for
    // every matched product if `seller_ids` was provided.
    const sellerLinks = transform(
      { input, products },
      ({ input, products }) => {
        if (input.update.seller_ids === undefined) return []
        const links: LinkDefinition[] = []
        for (const product of products) {
          for (const seller_id of input.update.seller_ids ?? []) {
            links.push({
              [Modules.PRODUCT]: { product_id: product.id },
              seller: { seller_id },
            })
          }
        }
        return links
      }
    )

    createRemoteLinkStep(sellerLinks).config({
      name: "mercur-update-products-seller-links",
    })

    // Marketplace: link any newly-provided attribute values to every
    // matched product. Existing links are left in place (additive).
    const attributeValueLinks = transform(
      { input, products },
      ({ input, products }) => {
        const links: LinkDefinition[] = []
        const inputs = [
          ...(input.update.product_attributes ?? []),
          ...(input.update.variant_attributes ?? []),
        ]
        for (const product of products) {
          for (const attr of inputs) {
            for (const value_id of attr.value_ids ?? []) {
              links.push({
                [Modules.PRODUCT]: { product_id: product.id },
                [MercurModules.PRODUCT_ATTRIBUTE]: {
                  product_attribute_value_id: value_id,
                },
              })
            }
          }
        }
        return links
      }
    )

    createRemoteLinkStep(attributeValueLinks).config({
      name: "mercur-update-products-attribute-value-links",
    })

    const productsUpdated = createHook("productsUpdated", {
      products,
      additional_data: input.additional_data,
    })

    emitEventStep({
      eventName: "product.updated",
      data: transform({ products }, ({ products }) =>
        products.map((p) => ({ id: p.id }))
      ),
    })

    return new WorkflowResponse(products, {
      hooks: [productsUpdated],
    })
  }
)
