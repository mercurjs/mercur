import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CreateProductAttributeValueDTO } from "@mercurjs/types"

import ProductModuleService from "../../../modules/product/service"

type CreateProductAttributeValuesStepInput = (CreateProductAttributeValueDTO & {
  attribute_id: string
})[]

export const createProductAttributeValuesStep = createStep(
  "create-product-attribute-values",
  async (data: CreateProductAttributeValuesStepInput, { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    const values = await service.createProductAttributeValues(data)
    return new StepResponse(
      values,
      values.map((v) => v.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.deleteProductAttributeValues(ids)
  }
)
