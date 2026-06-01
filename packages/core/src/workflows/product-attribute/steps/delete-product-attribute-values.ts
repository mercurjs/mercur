import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import type ProductAttributeModuleService from "../../../modules/product-attribute/service"

export const deleteProductAttributeValuesStepId =
  "pa-delete-product-attribute-values"

export const deleteProductAttributeValuesStep = createStep(
  deleteProductAttributeValuesStepId,
  async (ids: string[], { container }) => {
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    await service.softDeleteProductAttributeValues(ids)
    return new StepResponse(void 0, ids)
  },
  async (ids: string[] | undefined, { container }) => {
    if (!ids?.length) {
      return
    }
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    await service.restoreProductAttributeValues(ids)
  },
)
