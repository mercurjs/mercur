import { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type AttachProductOptionValuesToProductStepInput = {
  product_id: string
  product_option_id: string
  value_ids: string[]
}

export const attachProductOptionValuesToProductStepId =
  "pa-attach-product-option-values-to-product"

/**
 * Option values created after the option was already assigned to a product are
 * not associated with that product, so variant create rejects them with
 * "Option value X does not exist for option Y".
 *
 * Medusa's stock `updateProductOptionValuesOnProductStep` can't be used here:
 * its compensation reads `product.options.values`, which crashes MikroORM
 * `expandDotPaths` on the 2.16 options-preview build.
 */
export const attachProductOptionValuesToProductStep = createStep(
  attachProductOptionValuesToProductStepId,
  async (input: AttachProductOptionValuesToProductStepInput, { container }) => {
    if (!input.value_ids.length) {
      return new StepResponse(void 0, null)
    }
    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)
    await service.updateProductOptionValuesOnProduct([
      {
        product_id: input.product_id,
        product_option_id: input.product_option_id,
        add: input.value_ids,
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
        remove: input.value_ids,
      },
    ])
  },
)
