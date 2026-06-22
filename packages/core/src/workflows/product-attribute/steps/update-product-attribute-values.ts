import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules, UpdateProductAttributeValueDTO } from "@mercurjs/types"

import type ProductAttributeModuleService from "../../../modules/product-attribute/service"

export const updateProductAttributeValuesStepId =
  "pa-update-product-attribute-values"

type UpdateProductAttributeValuesStepInput = {
  selector: Record<string, unknown>
  update: UpdateProductAttributeValueDTO
}

export const updateProductAttributeValuesStep = createStep(
  updateProductAttributeValuesStepId,
  async (
    { selector, update }: UpdateProductAttributeValuesStepInput,
    { container },
  ) => {
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    const prevValues = await service.listProductAttributeValues(selector)
    const valuesToUpdate = prevValues.map((v) => ({
      id: v.id,
      ...update,
    }))
    const result = await service.updateProductAttributeValues(valuesToUpdate)
    return new StepResponse(result, prevValues)
  },
  async (prevValues: any[] | undefined, { container }) => {
    if (!prevValues?.length) {
      return
    }
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    await service.updateProductAttributeValues(
      prevValues.map((v) => ({ ...v })),
    )
  },
)
