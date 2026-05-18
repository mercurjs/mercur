import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CreateProductAttributeDTO } from "@mercurjs/types"

import ProductModuleService from "../../../modules/product/service"

export const createProductAttributesStep = createStep(
  "create-product-attributes",
  async (data: CreateProductAttributeDTO[], { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    const attributes = await service.createProductAttributes(data)
    return new StepResponse(
      attributes,
      attributes.map((a) => a.id)
    )
  },
  async (ids: string[] | undefined, { container }) => {
    if (!ids?.length) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.deleteProductAttributes(ids)
  }
)
