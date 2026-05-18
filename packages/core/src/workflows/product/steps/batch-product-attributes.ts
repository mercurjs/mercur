import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import ProductModuleService from "../../../modules/product/service"

type BatchProductAttributesInput = {
  product_id: string
  create?: {
    attribute_id: string
    attribute_value_ids?: string[]
    values?: string[]
  }[]
  delete?: string[]
}

export const batchProductAttributesStep = createStep(
  "batch-product-attributes",
  async (input: BatchProductAttributesInput, { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)

    if (input.create?.length) {
      await service.addAttributesToProduct(input.product_id, input.create)
    }

    if (input.delete?.length) {
      await service.removeAttributeFromProduct(
        input.product_id,
        input.delete
      )
    }

    return new StepResponse(void 0, input)
  }
)
