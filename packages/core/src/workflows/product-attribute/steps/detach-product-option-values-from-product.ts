import { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type DetachProductOptionValuesFromProductStepInput = {
  product_id: string
  product_option_id: string
  value_ids: string[]
}

export const detachProductOptionValuesFromProductStepId =
  "pa-detach-product-option-values-from-product"

/**
 * Medusa refuses to delete option values still associated with a product.
 *
 * Medusa's stock `updateProductOptionValuesOnProductStep` can't be used here:
 * its compensation reads `product.options.values`, which crashes MikroORM
 * `expandDotPaths` on the 2.16 options-preview build.
 */
export const detachProductOptionValuesFromProductStep = createStep(
  detachProductOptionValuesFromProductStepId,
  async (
    input: DetachProductOptionValuesFromProductStepInput,
    { container },
  ) => {
    if (!input.value_ids.length) {
      return new StepResponse(void 0, null)
    }
    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)
    await service.updateProductOptionValuesOnProduct([
      {
        product_id: input.product_id,
        product_option_id: input.product_option_id,
        remove: input.value_ids,
      },
    ])
    return new StepResponse(void 0, input)
  },
  async (input, { container }) => {
    if (!input?.value_ids.length) {
      return
    }
    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)
    await service.updateProductOptionValuesOnProduct([
      {
        product_id: input.product_id,
        product_option_id: input.product_option_id,
        add: input.value_ids,
      },
    ])
  },
)
