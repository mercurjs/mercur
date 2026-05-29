import {
  IProductModuleService,
  UpdateProductOptionValueDTO,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export const updateProductOptionValuesStepId = "pa-update-product-option-values"

type UpdateProductOptionValuesStepInput = {
  ids: string[]
  update: UpdateProductOptionValueDTO
}

type PrevValueScalar = {
  id: string
  value: string
}

/**
 * Direct wrapper over `IProductModuleService.updateProductOptionValues`
 * because stock Medusa does not expose a `updateProductOptionValuesWorkflow`
 * — only `updateProductOptionsWorkflow` (which operates on the parent
 * option) and inline value updates via the parent workflow's full
 * `values: string[]` replacement (which would reorder IDs and break
 * variant identity).
 *
 * Used by `mirrorProductAttributeValueRenameWorkflow` to propagate a
 * `ProductAttributeValue.name` change into every linked
 * `ProductOptionValue.value`. Compensation restores the captured prior
 * value strings.
 */
export const updateProductOptionValuesStep = createStep(
  updateProductOptionValuesStepId,
  async (
    { ids, update }: UpdateProductOptionValuesStepInput,
    { container },
  ) => {
    if (!ids.length) {
      return new StepResponse([] as PrevValueScalar[], [] as PrevValueScalar[])
    }

    const productService = container.resolve<IProductModuleService>(
      Modules.PRODUCT,
    )

    const prev = await productService.listProductOptionValues({ id: ids })
    const prevScalars: PrevValueScalar[] = prev.map((v) => ({
      id: v.id,
      value: v.value,
    }))

    await productService.updateProductOptionValues({ id: ids }, update)

    return new StepResponse(prevScalars, prevScalars)
  },
  async (prevScalars: PrevValueScalar[] | undefined, { container }) => {
    if (!prevScalars?.length) {
      return
    }
    const productService = container.resolve<IProductModuleService>(
      Modules.PRODUCT,
    )
    for (const { id, value } of prevScalars) {
      await productService.updateProductOptionValues({ id }, { value })
    }
  },
)
