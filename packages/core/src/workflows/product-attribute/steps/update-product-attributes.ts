import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules, UpdateProductAttributeDTO } from "@mercurjs/types"

import type ProductAttributeModuleService from "../../../modules/product-attribute/service"

export const updateProductAttributesStepId = "pa-update-product-attributes"

type UpdateProductAttributesStepInput = {
  selector: Record<string, unknown>
  update: UpdateProductAttributeDTO
}

export const updateProductAttributesStep = createStep(
  updateProductAttributesStepId,
  async (
    { selector, update }: UpdateProductAttributesStepInput,
    { container },
  ) => {
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
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
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    await service.updateProductAttributes(
      prevAttributes.map((a) => ({ ...a })),
    )
  },
)
