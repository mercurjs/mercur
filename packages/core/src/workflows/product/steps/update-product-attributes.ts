import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { UpdateProductAttributeDTO } from "@mercurjs/types"

import ProductModuleService from "../../../modules/product/service"

type UpdateProductAttributesStepInput = {
  selector: Record<string, unknown>
  update: UpdateProductAttributeDTO
}

export const updateProductAttributesStep = createStep(
  "update-product-attributes",
  async (
    { selector, update }: UpdateProductAttributesStepInput,
    { container }
  ) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    const prevAttributes = await service.listProductAttributes(selector)
    const attributesToUpdate = prevAttributes.map((a) => ({
      id: a.id,
      ...update,
    }))
    const attributes = await service.updateProductAttributes(attributesToUpdate)
    return new StepResponse(attributes, prevAttributes)
  },
  async (prevAttributes: any[] | undefined, { container }) => {
    if (!prevAttributes?.length) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.updateProductAttributes(
      prevAttributes.map((a) => ({ ...a }))
    )
  }
)
