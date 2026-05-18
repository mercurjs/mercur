import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import ProductModuleService from "../../../modules/product/service"

type RemoveAttributeFromProductInput = {
  product_id: string
  attribute_id: string
}

export const removeAttributeFromProductStep = createStep(
  "remove-attribute-from-product",
  async (input: RemoveAttributeFromProductInput, { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.removeAttributeFromProduct(
      input.product_id,
      input.attribute_id
    )
    return new StepResponse(void 0, input)
  }
)
