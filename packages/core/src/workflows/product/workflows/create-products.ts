import {
  createHook,
  createWorkflow,
  parallelize,
  transform,
  when,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData, LinkDefinition } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  createProductsWorkflow as stockCreateProductsWorkflow,
  createRemoteLinkStep,
  emitEventStep,
} from "@medusajs/medusa/core-flows"
import { MercurModules } from "@mercurjs/types"

import { linkSellersToProductWorkflow } from "./link-sellers-to-product"

type ProductAttributeInput = {
  attribute_id: string
  value_ids?: string[]
}

export type CreateProductsWorkflowInput = {
  products: (Record<string, unknown> & {
    seller_ids?: string[]
    product_attributes?: ProductAttributeInput[]
    variant_attributes?: ProductAttributeInput[]
  })[]
} & AdditionalData

export const createProductsWorkflowId = "mercur-create-products"

/**
 * Marketplace wrapper over stock `createProductsWorkflow`. Strips
 * marketplace-only fields (`seller_ids`, `product_attributes`,
 * `variant_attributes`) before delegating to stock, then links sellers
 * via `linkSellersToProductWorkflow` and attribute values via
 * `product_attribute_value_link` for each created product.
 */
export type CreateProductsWorkflowHooks = [
  Hook<
    "validate",
    { input: CreateProductsWorkflowInput; products: CreateProductsWorkflowInput["products"] },
    unknown
  >,
  Hook<
    "productsCreated",
    {
      products: unknown
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const createProductsWorkflow: ReturnWorkflow<
  CreateProductsWorkflowInput,
  any,
  CreateProductsWorkflowHooks
> = createWorkflow(
  createProductsWorkflowId,
  function (input: CreateProductsWorkflowInput) {
    const validate = createHook("validate", {
      input,
      products: input.products,
    })

    const stockProducts = transform({ input }, ({ input }) =>
      input.products.map((p) => {
        const {
          seller_ids: _s,
          product_attributes: _pa,
          variant_attributes: _va,
          ...rest
        } = p
        return rest
      })
    )

    const createdProducts = stockCreateProductsWorkflow.runAsStep({
      input: {
        products: stockProducts as any,
        additional_data: input.additional_data,
      },
    })

    // Marketplace: link sellers per product via `product_seller` pivot.
    const sellerLinks = transform(
      { input, createdProducts },
      ({ input, createdProducts }) => {
        const links: LinkDefinition[] = []
        input.products.forEach((p, idx) => {
          const product = createdProducts[idx]
          if (!product) return
          for (const seller_id of p.seller_ids ?? []) {
            links.push({
              [Modules.PRODUCT]: { product_id: product.id },
              seller: { seller_id },
            })
          }
        })
        return links
      }
    )

    createRemoteLinkStep(sellerLinks).config({
      name: "mercur-create-products-seller-links",
    })

    // Marketplace: link existing ProductAttributeValue rows via
    // `product_attribute_value_link` for each value id provided in
    // `product_attributes[].value_ids` and `variant_attributes[].value_ids`.
    const attributeValueLinks = transform(
      { input, createdProducts },
      ({ input, createdProducts }) => {
        const links: LinkDefinition[] = []
        input.products.forEach((p, idx) => {
          const product = createdProducts[idx]
          if (!product) return
          const inputs = [
            ...(p.product_attributes ?? []),
            ...(p.variant_attributes ?? []),
          ]
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
        })
        return links
      }
    )

    createRemoteLinkStep(attributeValueLinks).config({
      name: "mercur-create-products-attribute-value-links",
    })

    const productsCreated = createHook("productsCreated", {
      products: createdProducts,
      additional_data: input.additional_data,
    })

    emitEventStep({
      eventName: "product.created",
      data: transform({ createdProducts }, ({ createdProducts }) =>
        createdProducts.map((p) => ({ id: p.id }))
      ),
    })

    return new WorkflowResponse(createdProducts, {
      hooks: [validate, productsCreated] as const,
    })
  }
)
