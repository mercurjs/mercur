import { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type DetachAndDeleteProductOptionsInput = string[]

/**
 * Deletes synthesised variant-axis product options.
 *
 * Since Medusa 2.16 (global product options) tearing down an axis option is
 * a three-step affair, because the module guards both ends:
 *   1. `removeProductOptionFromProduct` throws "Cannot unassign product
 *      option from product which has variants for that option" while any
 *      variant still references the option's values.
 *   2. `deleteProductOptions` throws "Cannot delete product options that are
 *      associated with products" while the option is still attached.
 *
 * These axis options are exclusive (one product each), so we:
 *   1. delete the variants that reference the option (detaching a
 *      variant-defining axis collapses the variants it distinguished — the
 *      previous behaviour likewise dropped the option dimension),
 *   2. detach the option from its product(s),
 *   3. delete the option.
 *
 * Terminal step of the detach flow — no compensation (re-materialising the
 * option, its values, the product link, and the deleted variants is not
 * meaningfully recoverable here).
 */
export const detachAndDeleteProductOptionsStepId =
  "pa-detach-and-delete-product-options"

export const detachAndDeleteProductOptionsStep = createStep(
  detachAndDeleteProductOptionsStepId,
  async (option_ids: DetachAndDeleteProductOptionsInput, { container }) => {
    if (!option_ids?.length) {
      return new StepResponse(void 0)
    }

    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)

    const options = await service.listProductOptions(
      { id: option_ids },
      { relations: ["products", "values"] },
    )

    const pairs: { product_option_id: string; product_id: string }[] = []
    const productIds = new Set<string>()
    const targetValueIds = new Set<string>()
    for (const option of options) {
      for (const value of (option.values ?? []) as Array<{ id: string }>) {
        targetValueIds.add(value.id)
      }
      for (const product of (option.products ?? []) as Array<{ id: string }>) {
        pairs.push({ product_option_id: option.id, product_id: product.id })
        productIds.add(product.id)
      }
    }

    // Delete variants that still reference any of these options' values so
    // the option can be unassigned.
    if (productIds.size && targetValueIds.size) {
      const products = await service.listProducts(
        { id: Array.from(productIds) },
        { relations: ["variants.options"] },
      )
      const variantIdsToDelete: string[] = []
      for (const product of products) {
        for (const variant of (product.variants ?? []) as Array<{
          id: string
          options?: Array<{ id: string }>
        }>) {
          const usesOption = (variant.options ?? []).some((ov) =>
            targetValueIds.has(ov.id),
          )
          if (usesOption) {
            variantIdsToDelete.push(variant.id)
          }
        }
      }
      if (variantIdsToDelete.length) {
        await service.deleteProductVariants(variantIdsToDelete)
      }
    }

    if (pairs.length) {
      await service.removeProductOptionFromProduct(pairs)
    }

    await service.deleteProductOptions(option_ids)

    return new StepResponse(void 0)
  },
)
