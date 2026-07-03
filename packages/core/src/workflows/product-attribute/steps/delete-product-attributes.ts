import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import type ProductAttributeModuleService from "../../../modules/product-attribute/service"

export const deleteProductAttributesStepId = "pa-delete-product-attributes"

export const deleteProductAttributesStep = createStep(
  deleteProductAttributesStepId,
  async (ids: string[], { container }) => {
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    await service.softDeleteProductAttributes(ids)
    return new StepResponse(void 0, ids)
  },
  async (ids: string[] | undefined, { container }) => {
    if (!ids?.length) {
      return
    }
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    await service.restoreProductAttributes(ids)
  },
)
