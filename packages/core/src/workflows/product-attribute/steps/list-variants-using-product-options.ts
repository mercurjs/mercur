import { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type ListVariantsUsingProductOptionsStepInput = {
  product_id: string
  option_ids: string[]
}

/**
 * `variants.options` can't be read through the remote joiner on the 2.16
 * options-preview build, so the variants are listed off the product module.
 */
export const listVariantsUsingProductOptionsStepId =
  "pa-list-variants-using-product-options"

export const listVariantsUsingProductOptionsStep = createStep(
  listVariantsUsingProductOptionsStepId,
  async (input: ListVariantsUsingProductOptionsStepInput, { container }) => {
    if (!input.option_ids.length) {
      return new StepResponse<string[]>([])
    }

    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)
    const variants = await service.listProductVariants(
      { product_id: input.product_id },
      { relations: ["options"] },
    )

    const optionIds = new Set(input.option_ids)
    const ids = variants
      .filter((variant) =>
        (variant.options ?? []).some(
          (value) => !!value.option_id && optionIds.has(value.option_id),
        ),
      )
      .map((variant) => variant.id)

    return new StepResponse(ids)
  },
)
