import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData, LinkDefinition } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  createProductsWorkflow as stockCreateProductsWorkflow,
  createRemoteLinkStep,
  emitEventStep,
} from "@medusajs/medusa/core-flows"
import {
  CreateProductDTO,
  MercurModules,
  ProductAttributeInputDTO,
} from "@mercurjs/types"

import { associateSellersWithProductStep } from "../steps/associate-sellers-with-product"

type ProductOptionInput = { title: string; values: string[] }

/**
 * Per-product input on the create wrapper. Extends `CreateProductDTO`
 * from `@mercurjs/types/product/mutations` with the marketplace-only
 * `seller_ids` field (authoritative authorization list for the created
 * product).
 */
export type CreateProductWorkflowInput = CreateProductDTO & {
  seller_ids?: string[]
}

export type CreateProductsWorkflowInput = {
  products: CreateProductWorkflowInput[]
  /**
   * Marketplace add-on: seller ids to authorize for **every** created
   * product. For per-product seller authorization, set `seller_ids` on
   * the individual product entry instead.
   */
  seller_ids?: string[]
} & AdditionalData

export const createProductsWorkflowId = "mercur-create-products"

const DEFAULT_OPTION_TITLE = "Default option"
const DEFAULT_OPTION_VALUE = "Default option value"

type GlobalAttribute = Extract<ProductAttributeInputDTO, { attribute_id: string }>
type InlineAttribute = Extract<ProductAttributeInputDTO, { name: string }>

const isInline = (a: ProductAttributeInputDTO): a is InlineAttribute =>
  !("attribute_id" in a)

const isGlobal = (a: ProductAttributeInputDTO): a is GlobalAttribute =>
  "attribute_id" in a

/**
 * Marketplace wrapper over stock `createProductsWorkflow`.
 *
 * Translation rules:
 * - Inline custom variant-axis attributes (`{ name, type, values,
 *   is_variant_axis: true }` in `variant_attributes`) become stock
 *   `options[]` entries so the stock workflow can generate variants.
 * - Existing global attribute references (`{ attribute_id, value_ids }`)
 *   are stripped from the product payload and instead written as
 *   `product_attribute_value_link` rows after the stock create returns.
 * - Every variant is pinned to `manage_inventory: false` (marketplace
 *   invariant — vendor-owned variants never participate in inventory
 *   bookkeeping).
 * - `seller_ids` (per-product or input-level) is materialized as
 *   `product_seller` link rows via `associateSellersWithProductStep`.
 */
export const createProductsWorkflow: any = createWorkflow(
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
          variant_attributes,
          options,
          variants,
          ...rest
        } = p as CreateProductWorkflowInput & {
          options?: ProductOptionInput[]
          variants?: Array<Record<string, unknown>>
        }

        const inlineVariantAxes = (variant_attributes ?? []).filter(
          (a): a is InlineAttribute =>
            isInline(a) &&
            Boolean(a.is_variant_axis) &&
            Boolean(a.values?.length)
        )

        const inlineAxisOptions: ProductOptionInput[] = inlineVariantAxes.map(
          (a) => ({ title: a.name, values: [...(a.values ?? [])] })
        )

        const mergedOptions = [...(options ?? []), ...inlineAxisOptions]

        const stockVariants = (variants ?? []).map((v) => {
          const { attribute_values: _avv, ...vRest } =
            v as unknown as Record<string, unknown>
          return {
            ...vRest,
            manage_inventory: false,
          }
        })

        // Default option/variant for simple products so stock's variant
        // validator does not throw on a variantful product with no options.
        if (mergedOptions.length === 0 && stockVariants.length === 0) {
          return {
            ...rest,
            options: [
              { title: DEFAULT_OPTION_TITLE, values: [DEFAULT_OPTION_VALUE] },
            ],
            variants: [
              {
                title: "Default variant",
                manage_inventory: false,
                options: {
                  [DEFAULT_OPTION_TITLE]: DEFAULT_OPTION_VALUE,
                },
              },
            ],
          }
        }

        return {
          ...rest,
          ...(mergedOptions.length ? { options: mergedOptions } : {}),
          ...(stockVariants.length ? { variants: stockVariants } : {}),
        }
      })
    )

    const createdProducts = stockCreateProductsWorkflow.runAsStep({
      input: {
        products: stockProducts as any,
        additional_data: input.additional_data,
      },
    })

    // Seller links — per-product `seller_ids` wins over the input-level
    // fallback. Flattened to a single batched call.
    const sellerProductLinks = transform(
      { input, createdProducts },
      ({ input, createdProducts }) => {
        const links: { product_id: string; seller_id: string }[] = []
        input.products.forEach((p, idx) => {
          const product_id = createdProducts[idx]?.id
          if (!product_id) return
          const sellerIds = p.seller_ids ?? input.seller_ids ?? []
          for (const seller_id of sellerIds) {
            links.push({ product_id, seller_id })
          }
        })
        return links
      }
    )

    associateSellersWithProductStep({ links: sellerProductLinks }).config({
      name: "mercur-create-products-associate-sellers",
    })

    // Product-level `product_attribute_value_link` rows for global
    // attribute references in product_attributes / variant_attributes.
    const productAttributeValueLinks = transform(
      { input, createdProducts },
      ({ input, createdProducts }) => {
        const links: LinkDefinition[] = []
        input.products.forEach((p, idx) => {
          const product = createdProducts[idx]
          if (!product) return
          const sources: ProductAttributeInputDTO[] = [
            ...(p.product_attributes ?? []),
            ...(p.variant_attributes ?? []),
          ]
          for (const attr of sources) {
            if (!isGlobal(attr)) continue
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

    createRemoteLinkStep(productAttributeValueLinks).config({
      name: "mercur-create-products-product-attribute-value-links",
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
