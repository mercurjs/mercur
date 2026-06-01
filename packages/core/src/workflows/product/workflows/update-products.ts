import {
  createHook,
  createWorkflow,
  transform,
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
import {
  MercurModules,
  ProductAttributeInputDTO,
  UpdateProductDTO,
} from "@mercurjs/types"

import { associateSellersWithProductStep } from "../steps/associate-sellers-with-product"

type ProductOptionInput = { title: string; values: string[] }

/**
 * Per-update payload on the wrapper. Extends `UpdateProductDTO` from
 * `@mercurjs/types/product/mutations` with the marketplace-only
 * `seller_ids` field.
 */
export type UpdateProductWorkflowUpdate = UpdateProductDTO & {
  seller_ids?: string[]
}

export type UpdateProductsWorkflowInput = {
  selector: Record<string, unknown>
  update: UpdateProductWorkflowUpdate
} & AdditionalData

export const updateProductsWorkflowId = "mercur-update-products"

type GlobalAttribute = Extract<ProductAttributeInputDTO, { attribute_id: string }>
type InlineAttribute = Extract<ProductAttributeInputDTO, { name: string }>

const isInline = (a: ProductAttributeInputDTO): a is InlineAttribute =>
  !("attribute_id" in a)

const isGlobal = (a: ProductAttributeInputDTO): a is GlobalAttribute =>
  "attribute_id" in a

/**
 * Marketplace wrapper over stock `updateProductsWorkflow`. Same
 * translation as create-products: inline-custom attributes become
 * stock `options[]`, global-attribute references become
 * `product_attribute_value_link` rows. Variant `manage_inventory` is
 * pinned to `false` on every variant in the payload (defensive — the
 * marketplace invariant cannot regress through a vendor patch). The
 * attribute-link write is additive — existing links are not removed.
 */
export const updateProductsWorkflow: any = createWorkflow(
  updateProductsWorkflowId,
  function (input: UpdateProductsWorkflowInput) {
    const stockInput = transform({ input }, ({ input }) => {
      const {
        seller_ids: _s,
        product_attributes: _pa,
        variant_attributes,
        options,
        variants,
        ...update
      } = input.update

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

      const stockVariants =
        variants?.map((v) => {
          const {
            attribute_values: _avv,
            manage_inventory: _mi,
            ...rest
          } = v as unknown as {
            attribute_values?: unknown
            manage_inventory?: unknown
            [k: string]: unknown
          }
          return { ...rest, manage_inventory: false }
        }) ?? undefined

      return {
        selector: input.selector,
        update: {
          ...update,
          ...(mergedOptions.length ? { options: mergedOptions } : {}),
          ...(stockVariants ? { variants: stockVariants } : {}),
        },
        additional_data: input.additional_data,
      }
    })

    stockUpdateProductsWorkflow.runAsStep({ input: stockInput as any })

    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: ["id"],
      filters: input.selector,
    }).config({ name: "mercur-update-products-load" })

    // Marketplace: add seller links for every matched product if
    // `seller_ids` was provided. Flattened into a single batched call —
    // workflow definitions can't iterate over a runtime-derived array.
    const sellerProductLinks = transform(
      { input, products },
      ({ input, products }) => {
        if (input.update.seller_ids === undefined) return []
        const links: { product_id: string; seller_id: string }[] = []
        for (const product of products) {
          for (const seller_id of input.update.seller_ids ?? []) {
            links.push({ product_id: product.id as string, seller_id })
          }
        }
        return links
      }
    )

    associateSellersWithProductStep({ links: sellerProductLinks }).config({
      name: "mercur-update-products-associate-sellers",
    })

    // Marketplace: add product-level attribute_value links (additive).
    const productAttributeValueLinks = transform(
      { input, products },
      ({ input, products }) => {
        const links: LinkDefinition[] = []
        const sources: ProductAttributeInputDTO[] = [
          ...(input.update.product_attributes ?? []),
          ...(input.update.variant_attributes ?? []),
        ]
        for (const product of products) {
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
        }
        return links
      }
    )

    createRemoteLinkStep(productAttributeValueLinks).config({
      name: "mercur-update-products-product-attribute-value-links",
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
