import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { UpdateProductAttributeValueDTO } from "@mercurjs/types"

import ProductModuleService from "../../../modules/product/service"

type UpdateProductAttributeValuesStepInput = {
  selector: Record<string, unknown>
  update: UpdateProductAttributeValueDTO
}

export const updateProductAttributeValuesStep = createStep(
  "update-product-attribute-values",
  async (
    { selector, update }: UpdateProductAttributeValuesStepInput,
    { container }
  ) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    const prevValues = await service.listProductAttributeValues(selector)
    const valuesToUpdate = prevValues.map((v) => ({
      id: v.id,
      ...update,
    }))
    const result = await service.updateProductAttributeValues(valuesToUpdate)
    return new StepResponse(result, prevValues)
  },
  async (prevValues: any, { container }) => {
    if (!prevValues?.length) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.updateProductAttributeValues(
      prevValues.map((v) => ({ ...v }))
    )
  }
)
