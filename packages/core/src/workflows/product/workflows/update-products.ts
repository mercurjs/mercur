import {
  createHook,
  createWorkflow,
  type ReturnWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData, ProductTypes } from "@medusajs/framework/types"
import {
  emitEventStep,
  updateProductsWorkflow as stockUpdateProductsWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { UpdateProductDTO } from "@mercurjs/types"

import { associateSellersWithProductStep } from "../steps"

type ProductOptionInput = { title: string; values: string[] }

/**
 * SPEC-014: the update wrapper does NOT handle attributes — attribute edits go
 * exclusively through the batch engine
 * (`createAndLinkProductAttributesToProductWorkflow`). This wrapper only updates
 * core product fields + variants and re-associates sellers; variant
 * `manage_inventory` is pinned to `false` (marketplace invariant).
 */
export type UpdateProductWorkflowUpdate = Omit<
  UpdateProductDTO,
  "variant_attributes" | "product_attributes" | "variants"
> & {
  seller_ids?: string[]
  options?: ProductOptionInput[]
  variants?: Array<
    Record<string, unknown> & {
      options?: Record<string, string>
      manage_inventory?: boolean
    }
  >
}

export type UpdateProductsWorkflowInput = {
  selector: Record<string, unknown>
  update: UpdateProductWorkflowUpdate
} & AdditionalData

export const updateProductsWorkflowId = "mercur-update-products"

export const updateProductsWorkflow: ReturnWorkflow<
  UpdateProductsWorkflowInput,
  ProductTypes.ProductDTO[],
  unknown[]
> = createWorkflow(
  updateProductsWorkflowId,
  function (input: UpdateProductsWorkflowInput) {
    const stockInput = transform({ input }, ({ input }) => {
      const { seller_ids: _s, variants, ...update } = input.update

      const stockVariants = variants?.map((v) => {
        const { manage_inventory: _mi, options: vopts, ...rest } = v
        return {
          ...rest,
          manage_inventory: false,
          ...(vopts ? { options: vopts } : {}),
        }
      })

      return {
        selector: input.selector,
        update: {
          ...update,
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
      },
    )

    associateSellersWithProductStep({ links: sellerProductLinks }).config({
      name: "mercur-update-products-associate-sellers",
    })

    const productsUpdated = createHook("productsUpdated", {
      products,
      additional_data: input.additional_data,
    })

    emitEventStep({
      eventName: "product.updated",
      data: transform({ products }, ({ products }) =>
        products.map((p) => ({ id: p.id })),
      ),
    })

    return new WorkflowResponse(products, {
      hooks: [productsUpdated],
    })
  },
)
